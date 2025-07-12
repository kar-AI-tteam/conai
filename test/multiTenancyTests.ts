// Multi-Tenancy Tests

import { TestEnvironment } from './testSetup';
import { TEST_CONFIG } from './testConfig';
import { Tenant, User, DataSource } from '../src/types/enterprise';

interface MultiTenancyTestResult {
  name: string;
  success: boolean;
  details?: string;
  error?: Error;
}

export async function runMultiTenancyTests(testEnv: TestEnvironment): Promise<MultiTenancyTestResult[]> {
  const results: MultiTenancyTestResult[] = [];
  
  try {
    // Test 1: Tenant Isolation
    results.push(await testTenantIsolation(testEnv));
    
    // Test 2: User Permissions
    results.push(await testUserPermissions(testEnv));
    
    // Test 3: Cross-Tenant Access Control
    results.push(await testCrossTenantAccess(testEnv));
    
    // Test 4: Tenant Quotas
    results.push(await testTenantQuotas(testEnv));
    
  } catch (error) {
    console.error('Error running multi-tenancy tests:', error);
    results.push({
      name: 'Multi-Tenancy Test Suite',
      success: false,
      error: error as Error
    });
  }
  
  return results;
}

async function testTenantIsolation(testEnv: TestEnvironment): Promise<MultiTenancyTestResult> {
  try {
    console.log('  - Testing tenant isolation...');
    
    // Create two tenants
    const tenant1: Tenant = {
      id: 'test-tenant-1',
      name: 'Test Tenant 1',
      domain: 'tenant1.example.com',
      settings: {
        maxUsers: 10,
        maxDocuments: 1000,
        maxQueries: 5000,
        retentionDays: 30,
        allowedDataSources: ['pdf', 'word']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const tenant2: Tenant = {
      id: 'test-tenant-2',
      name: 'Test Tenant 2',
      domain: 'tenant2.example.com',
      settings: {
        maxUsers: 10,
        maxDocuments: 1000,
        maxQueries: 5000,
        retentionDays: 30,
        allowedDataSources: ['pdf', 'word']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await testEnv.tenantManager.createTenant(tenant1);
    await testEnv.tenantManager.createTenant(tenant2);
    
    // Add document to tenant 1
    const dataSource1: DataSource = {
      id: 'ds-tenant1',
      tenantId: tenant1.id,
      name: 'Tenant 1 Documents',
      type: 'pdf',
      config: {
        preprocessing: {
          chunkSize: 1000,
          chunkOverlap: 200,
          extractMetadata: true
        }
      },
      status: 'active',
      isActive: true
    };
    
    const mockFile = {
      path: './test/data/tenant1-doc.pdf',
      size: 1024 * 1024,
      type: 'application/pdf'
    };
    
    await testEnv.dataIngestion.processDocument(
      mockFile,
      dataSource1.config,
      tenant1.id
    );
    
    // Try to access tenant 1's document from tenant 2
    const query = "Test document";
    const results = await testEnv.retrieverEngine.search(
      query,
      {},
      tenant2.id
    );
    
    // Verify tenant isolation
    const success = results.length === 0; // Should not find tenant 1's document
    
    return {
      name: 'Tenant Isolation',
      success,
      details: success 
        ? 'Tenant isolation working correctly - no cross-tenant data access'
        : 'Tenant isolation failed - cross-tenant data access detected'
    };
  } catch (error) {
    console.error('Tenant isolation test failed:', error);
    return {
      name: 'Tenant Isolation',
      success: false,
      error: error as Error
    };
  }
}

async function testUserPermissions(testEnv: TestEnvironment): Promise<MultiTenancyTestResult> {
  try {
    console.log('  - Testing user permissions...');
    
    // Create users with different permissions
    const adminUser: User = {
      id: 'admin-user',
      tenantId: testEnv.testTenant.id,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      permissions: [
        { resource: '*', actions: ['read', 'write', 'delete', 'admin'] }
      ],
      createdAt: new Date().toISOString()
    };
    
    const readOnlyUser: User = {
      id: 'readonly-user',
      tenantId: testEnv.testTenant.id,
      username: 'reader',
      email: 'reader@example.com',
      role: 'viewer',
      permissions: [
        { resource: 'documents', actions: ['read'] }
      ],
      createdAt: new Date().toISOString()
    };
    
    // Check admin permissions
    const adminCanRead = await testEnv.tenantManager.checkAccess(
      adminUser.id,
      'documents',
      'read'
    );
    
    const adminCanWrite = await testEnv.tenantManager.checkAccess(
      adminUser.id,
      'documents',
      'write'
    );
    
    // Check read-only permissions
    const readerCanRead = await testEnv.tenantManager.checkAccess(
      readOnlyUser.id,
      'documents',
      'read'
    );
    
    const readerCanWrite = await testEnv.tenantManager.checkAccess(
      readOnlyUser.id,
      'documents',
      'write'
    );
    
    const success = adminCanRead && adminCanWrite && readerCanRead && !readerCanWrite;
    
    return {
      name: 'User Permissions',
      success,
      details: success
        ? 'User permissions working correctly'
        : 'User permissions not enforced correctly'
    };
  } catch (error) {
    console.error('User permissions test failed:', error);
    return {
      name: 'User Permissions',
      success: false,
      error: error as Error
    };
  }
}

async function testCrossTenantAccess(testEnv: TestEnvironment): Promise<MultiTenancyTestResult> {
  try {
    console.log('  - Testing cross-tenant access control...');
    
    // Create two tenants
    const tenant1: Tenant = {
      id: 'cross-tenant-1',
      name: 'Cross Tenant 1',
      domain: 'cross1.example.com',
      settings: {
        maxUsers: 10,
        maxDocuments: 1000,
        maxQueries: 5000,
        retentionDays: 30,
        allowedDataSources: ['pdf', 'word']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const tenant2: Tenant = {
      id: 'cross-tenant-2',
      name: 'Cross Tenant 2',
      domain: 'cross2.example.com',
      settings: {
        maxUsers: 10,
        maxDocuments: 1000,
        maxQueries: 5000,
        retentionDays: 30,
        allowedDataSources: ['pdf', 'word']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await testEnv.tenantManager.createTenant(tenant1);
    await testEnv.tenantManager.createTenant(tenant2);
    
    // Create users in each tenant
    const user1: User = {
      id: 'user-tenant1',
      tenantId: tenant1.id,
      username: 'user1',
      email: 'user1@example.com',
      role: 'admin',
      permissions: [
        { resource: '*', actions: ['read', 'write'] }
      ],
      createdAt: new Date().toISOString()
    };
    
    const user2: User = {
      id: 'user-tenant2',
      tenantId: tenant2.id,
      username: 'user2',
      email: 'user2@example.com',
      role: 'admin',
      permissions: [
        { resource: '*', actions: ['read', 'write'] }
      ],
      createdAt: new Date().toISOString()
    };
    
    // Try to access tenant 1's resources from tenant 2's user
    const canAccessCrossTenant = await testEnv.tenantManager.enforceDataIsolation(
      user2.id,
      'document-from-tenant1'
    );
    
    return {
      name: 'Cross-Tenant Access Control',
      success: !canAccessCrossTenant,
      details: !canAccessCrossTenant
        ? 'Cross-tenant access control working correctly'
        : 'Cross-tenant access control failed - unauthorized access allowed'
    };
  } catch (error) {
    console.error('Cross-tenant access test failed:', error);
    return {
      name: 'Cross-Tenant Access Control',
      success: false,
      error: error as Error
    };
  }
}

async function testTenantQuotas(testEnv: TestEnvironment): Promise<MultiTenancyTestResult> {
  try {
    console.log('  - Testing tenant quotas...');
    
    // Create tenant with low quotas
    const limitedTenant: Tenant = {
      id: 'limited-tenant',
      name: 'Limited Tenant',
      domain: 'limited.example.com',
      settings: {
        maxUsers: 2,
        maxDocuments: 5,
        maxQueries: 10,
        retentionDays: 30,
        allowedDataSources: ['pdf']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await testEnv.tenantManager.createTenant(limitedTenant);
    
    // Check document quota
    const documentQuota = await testEnv.tenantManager.checkQuota(
      limitedTenant.id,
      'documents'
    );
    
    // Check query quota
    const queryQuota = await testEnv.tenantManager.checkQuota(
      limitedTenant.id,
      'queries'
    );
    
    // Try to exceed quota
    let quotaExceeded = false;
    try {
      // Add documents up to quota limit
      for (let i = 0; i < limitedTenant.settings.maxDocuments + 1; i++) {
        await testEnv.tenantManager.trackUsage(limitedTenant.id, 'document', 1);
      }
    } catch (error) {
      quotaExceeded = true;
    }
    
    return {
      name: 'Tenant Quotas',
      success: documentQuota.allowed && queryQuota.allowed && quotaExceeded,
      details: 'Tenant quotas enforced correctly'
    };
  } catch (error) {
    console.error('Tenant quotas test failed:', error);
    return {
      name: 'Tenant Quotas',
      success: false,
      error: error as Error
    };
  }
}