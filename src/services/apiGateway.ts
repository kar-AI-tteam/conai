// API Gateway - Authentication, Rate Limiting, and Tenant Management

import { Request, Response, NextFunction } from 'express';
import { Tenant, User, UsageMetrics, AuditLog } from '../types/enterprise';
import { AuthService } from './authService';
import { RateLimiter } from './rateLimiter';
import { TenantService } from './tenantService';
import { AuditService } from './auditService';

export class APIGateway {
  private authService: AuthService;
  private rateLimiter: RateLimiter;
  private tenantService: TenantService;
  private auditService: AuditService;

  constructor() {
    this.authService = new AuthService();
    this.rateLimiter = new RateLimiter();
    this.tenantService = new TenantService();
    this.auditService = new AuditService();
  }

  // Authentication Middleware
  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = this.extractToken(req);
      if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const user = await this.authService.validateToken(token);
      if (!user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      // Add user context to request
      req.user = user;
      req.tenant = await this.tenantService.getTenant(user.tenantId);

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  }

  // Rate Limiting Middleware
  async rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      const tenant = req.tenant;

      if (!user || !tenant) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const isAllowed = await this.rateLimiter.checkLimit(
        user.id,
        tenant.id,
        req.path,
        tenant.settings
      );

      if (!isAllowed) {
        res.status(429).json({ 
          error: 'Rate limit exceeded',
          retryAfter: await this.rateLimiter.getRetryAfter(user.id, tenant.id)
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      res.status(500).json({ error: 'Rate limiting failed' });
    }
  }

  // Tenant Isolation Middleware
  async tenantIsolation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      const tenant = req.tenant;

      if (!user || !tenant) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Add tenant context to all database queries
      req.query.tenantId = tenant.id;
      req.body.tenantId = tenant.id;

      // Validate user belongs to tenant
      if (user.tenantId !== tenant.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      next();
    } catch (error) {
      console.error('Tenant isolation error:', error);
      res.status(500).json({ error: 'Tenant isolation failed' });
    }
  }

  // Usage Logging Middleware
  async usageLogging(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    
    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function(body) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log usage metrics
      APIGateway.prototype.logUsage(req, res, duration, body);
      
      return originalJson.call(this, body);
    };

    next();
  }

  // Audit Logging Middleware
  async auditLogging(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      const tenant = req.tenant;

      if (user && tenant) {
        await this.auditService.log({
          id: this.generateId(),
          tenantId: tenant.id,
          organizationId: user.organizationId,
          userId: user.id,
          action: this.mapMethodToAction(req.method),
          resourceType: this.extractResourceType(req.path),
          resourceId: this.extractResourceId(req.path),
          details: {
            path: req.path,
            method: req.method,
            query: req.query,
            body: this.sanitizeBody(req.body)
          },
          ipAddress: req.ip || req.connection.remoteAddress || '',
          userAgent: req.get('User-Agent') || '',
          timestamp: new Date().toISOString()
        });
      }

      next();
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't fail the request due to audit logging issues
      next();
    }
  }

  // CORS Middleware
  corsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const tenant = req.tenant;
    const allowedOrigins = tenant?.settings?.allowedOrigins || ['*'];

    const origin = req.get('Origin');
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    next();
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check for API key in headers
    const apiKey = req.get('X-API-Key');
    if (apiKey) {
      return apiKey;
    }

    return null;
  }

  private async logUsage(req: Request, res: Response, duration: number, responseBody: any): Promise<void> {
    try {
      const user = req.user;
      const tenant = req.tenant;

      if (!user || !tenant) return;

      const metrics: Partial<UsageMetrics> = {
        tenantId: tenant.id,
        organizationId: user.organizationId,
        period: new Date().toISOString().split('T')[0], // Daily metrics
        apiCalls: 1,
        computeTime: duration
      };

      // Increment specific counters based on endpoint
      if (req.path.includes('/query')) {
        metrics.queries = 1;
      }

      await this.auditService.logUsage(metrics);
    } catch (error) {
      console.error('Usage logging error:', error);
    }
  }

  private mapMethodToAction(method: string): string {
    const mapping = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete'
    };
    return mapping[method] || 'unknown';
  }

  private extractResourceType(path: string): string {
    const segments = path.split('/').filter(Boolean);
    return segments[1] || 'unknown'; // Assuming /api/resource/id format
  }

  private extractResourceId(path: string): string {
    const segments = path.split('/').filter(Boolean);
    return segments[2] || ''; // Assuming /api/resource/id format
  }

  private sanitizeBody(body: any): any {
    // Remove sensitive information from audit logs
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
      tenant?: Tenant;
    }
  }
}