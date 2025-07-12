// Tenant Management Service

import { Tenant, TenantSettings, TenantQuotas, User, AuditLog } from '../types/enterprise';

export class TenantService {
  private tenants: Map<string, Tenant> = new Map();
  private users: Map<string, User[]> = new Map();
  private auditLogs: Map<string, AuditLog[]> = new Map();

  async createTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
    const tenant: Tenant = {
      id: this.generateId(),
      name: tenantData.name || 'New Tenant',
      domain: tenantData.domain || '',
      settings: tenantData.settings || this.getDefaultSettings(),
      quotas: tenantData.quotas || this.getDefaultQuotas(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tenants.set(tenant.id, tenant);
    this.users.set(tenant.id, []);
    this.auditLogs.set(tenant.id, []);

    await this.logAudit(tenant.id, 'system', 'tenant.created', 'tenant', tenant.id, {
      tenantName: tenant.name
    });

    return tenant;
  }

  async getTenant(tenantId: string): Promise<Tenant | null> {
    return this.tenants.get(tenantId) || null;
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updatedTenant = {
      ...tenant,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.tenants.set(tenantId, updatedTenant);

    await this.logAudit(tenantId, 'system', 'tenant.updated', 'tenant', tenantId, {
      changes: updates
    });

    return updatedTenant;
  }

  async deleteTenant(tenantId: string): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Archive tenant data before deletion
    await this.archiveTenantData(tenantId);

    this.tenants.delete(tenantId);
    this.users.delete(tenantId);
    this.auditLogs.delete(tenantId);
  }

  async listTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }

  // User Management
  async createUser(tenantId: string, userData: Partial<User>): Promise<User> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check quota limits
    const currentUsers = this.users.get(tenantId) || [];
    if (currentUsers.length >= tenant.quotas.maxUsers) {
      throw new Error('User quota exceeded');
    }

    const user: User = {
      id: this.generateId(),
      tenantId,
      username: userData.username || '',
      email: userData.email || '',
      role: userData.role || 'user',
      permissions: userData.permissions || this.getDefaultPermissions(userData.role || 'user'),
      isActive: userData.isActive !== false,
      createdAt: new Date().toISOString()
    };

    currentUsers.push(user);
    this.users.set(tenantId, currentUsers);

    // Update quota usage
    tenant.quotas.currentUsage.users = currentUsers.length;
    await this.updateTenant(tenantId, { quotas: tenant.quotas });

    await this.logAudit(tenantId, 'system', 'user.created', 'user', user.id, {
      username: user.username,
      email: user.email,
      role: user.role
    });

    return user;
  }

  async getUser(tenantId: string, userId: string): Promise<User | null> {
    const users = this.users.get(tenantId) || [];
    return users.find(user => user.id === userId) || null;
  }

  async getUserByEmail(tenantId: string, email: string): Promise<User | null> {
    const users = this.users.get(tenantId) || [];
    return users.find(user => user.email === email) || null;
  }

  async updateUser(tenantId: string, userId: string, updates: Partial<User>): Promise<User> {
    const users = this.users.get(tenantId) || [];
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...users[userIndex],
      ...updates
    };

    users[userIndex] = updatedUser;
    this.users.set(tenantId, users);

    await this.logAudit(tenantId, userId, 'user.updated', 'user', userId, {
      changes: updates
    });

    return updatedUser;
  }

  async deleteUser(tenantId: string, userId: string): Promise<void> {
    const users = this.users.get(tenantId) || [];
    const filteredUsers = users.filter(user => user.id !== userId);
    
    if (users.length === filteredUsers.length) {
      throw new Error('User not found');
    }

    this.users.set(tenantId, filteredUsers);

    // Update quota usage
    const tenant = await this.getTenant(tenantId);
    if (tenant) {
      tenant.quotas.currentUsage.users = filteredUsers.length;
      await this.updateTenant(tenantId, { quotas: tenant.quotas });
    }

    await this.logAudit(tenantId, 'system', 'user.deleted', 'user', userId, {});
  }

  async listUsers(tenantId: string): Promise<User[]> {
    return this.users.get(tenantId) || [];
  }

  // Quota Management
  async checkQuota(tenantId: string, resource: keyof TenantQuotas['currentUsage']): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
  }> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const current = tenant.quotas.currentUsage[resource];
    const limit = tenant.quotas[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof TenantQuotas] as number;
    
    return {
      allowed: current < limit,
      current,
      limit,
      remaining: Math.max(0, limit - current)
    };
  }

  async updateQuotaUsage(tenantId: string, resource: keyof TenantQuotas['currentUsage'], delta: number): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    tenant.quotas.currentUsage[resource] = Math.max(0, tenant.quotas.currentUsage[resource] + delta);
    await this.updateTenant(tenantId, { quotas: tenant.quotas });
  }

  // Audit Logging
  async logAudit(
    tenantId: string,
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    ipAddress: string = '127.0.0.1',
    userAgent: string = 'system'
  ): Promise<void> {
    const auditLog: AuditLog = {
      id: this.generateId(),
      tenantId,
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString()
    };

    const logs = this.auditLogs.get(tenantId) || [];
    logs.push(auditLog);
    
    // Keep only last 10000 logs per tenant
    if (logs.length > 10000) {
      logs.splice(0, logs.length - 10000);
    }
    
    this.auditLogs.set(tenantId, logs);
  }

  async getAuditLogs(tenantId: string, filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    let logs = this.auditLogs.get(tenantId) || [];

    if (filters) {
      logs = logs.filter(log => {
        if (filters.userId && log.userId !== filters.userId) return false;
        if (filters.action && log.action !== filters.action) return false;
        if (filters.resource && log.resource !== filters.resource) return false;
        if (filters.startDate && log.timestamp < filters.startDate) return false;
        if (filters.endDate && log.timestamp > filters.endDate) return false;
        return true;
      });
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  // Helper Methods
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getDefaultSettings(): TenantSettings {
    return {
      allowedDataSources: ['pdf', 'word', 'excel', 'csv', 'json', 'xml'],
      retentionPolicy: 365, // 1 year
      encryptionEnabled: true,
      auditLogging: true
    };
  }

  private getDefaultQuotas(): TenantQuotas {
    return {
      maxUsers: 100,
      maxDocuments: 10000,
      maxQueries: 100000, // per month
      maxStorage: 100, // GB
      currentUsage: {
        users: 0,
        documents: 0,
        queries: 0,
        storage: 0
      }
    };
  }

  private getDefaultPermissions(role: string): any[] {
    const permissions = {
      admin: [
        { resource: '*', actions: ['read', 'write', 'delete', 'admin'] }
      ],
      user: [
        { resource: 'documents', actions: ['read', 'write'] },
        { resource: 'queries', actions: ['read', 'write'] }
      ],
      viewer: [
        { resource: 'documents', actions: ['read'] },
        { resource: 'queries', actions: ['read'] }
      ],
      analyst: [
        { resource: 'documents', actions: ['read'] },
        { resource: 'queries', actions: ['read', 'write'] },
        { resource: 'analytics', actions: ['read'] }
      ]
    };

    return permissions[role] || permissions.user;
  }

  private async archiveTenantData(tenantId: string): Promise<void> {
    // In a real implementation, this would archive data to long-term storage
    console.log(`Archiving data for tenant: ${tenantId}`);
  }
}