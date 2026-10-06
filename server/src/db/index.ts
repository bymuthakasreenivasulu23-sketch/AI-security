import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_USER_SETTINGS, RiskLevel, SeverityLevel } from '@trustlens/shared';

const { Pool } = pg;

export interface DBUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface DBUserSettings {
  user_id: string;
  auto_scan: boolean;
  ai_analysis: boolean;
  telemetry_enabled: boolean;
  sensitive_page_protection: boolean;
  show_low_confidence: boolean;
  risk_notification_threshold: number;
  retention_days: number;
  updated_at: string;
}

export interface DBScan {
  id: string;
  user_id: string;
  domain: string;
  page_url: string;
  page_title: string;
  page_type: string;
  risk_score: number;
  risk_level: RiskLevel;
  finding_count: number;
  analysis_mode?: 'ai' | 'rule_based';
  created_at: string;
}

export interface DBFinding {
  id: string;
  scan_id: string;
  category: string;
  title: string;
  severity: SeverityLevel;
  confidence: number;
  evidence: string;
  explanation: string;
  potential_impact: string;
  recommendation: string;
  source_element: string;
  created_at: string;
}

export interface DBFeedback {
  id: string;
  user_id: string;
  finding_id: string;
  feedback_type: string;
  notes?: string;
  created_at: string;
}

// In-Memory Fallback Store
class MemoryStore {
  users: Map<string, DBUser> = new Map();
  settings: Map<string, DBUserSettings> = new Map();
  scans: Map<string, DBScan> = new Map();
  findings: Map<string, DBFinding> = new Map();
  feedback: Map<string, DBFeedback> = new Map();

  constructor() {
    this.seedDemoUser();
  }

  seedDemoUser() {
    const demoId = '00000000-0000-0000-0000-000000000001';
    if (!this.users.has(demoId)) {
      const now = new Date().toISOString();
      this.users.set(demoId, {
        id: demoId,
        email: 'user@trustlens.local',
        display_name: 'TrustLens User',
        created_at: now,
        updated_at: now,
      });
      this.settings.set(demoId, {
        user_id: demoId,
        ...DEFAULT_USER_SETTINGS,
        updated_at: now,
      });
    }
  }
}

class DatabaseService {
  private pool: pg.Pool | null = null;
  private isConnected = false;
  private memoryStore = new MemoryStore();
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initPool();
  }

  private initPool() {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString && !connectionString.includes('localhost:5432/trustlens_ai_unconfigured')) {
      try {
        this.pool = new Pool({
          connectionString,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
          console.warn('[Database] PostgreSQL Pool encountered unexpected error:', err.message);
          this.isConnected = false;
        });
      } catch (e) {
        console.warn('[Database] Initializing pool failed, falling back to memory store:', e);
        this.pool = null;
      }
    }
  }

  async init(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = (async () => {
        if (this.pool) {
          try {
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            this.isConnected = true;
            console.log('[Database] Connected to PostgreSQL successfully.');
          } catch (err: any) {
            console.warn(`[Database] PostgreSQL connection unavailable (${err.message}). Using resilient in-memory store.`);
            this.isConnected = false;
          }
        } else {
          console.log('[Database] No active PostgreSQL database configured. Using resilient in-memory store.');
        }
      })();
    }
    return this.initializationPromise;
  }

  get usingPostgres(): boolean {
    return this.isConnected && this.pool !== null;
  }

  // --- Users ---
  async getOrCreateUser(email: string, displayName = 'TrustLens User'): Promise<DBUser> {
    await this.init();
    if (this.usingPostgres && this.pool) {
      const existing = await this.pool.query<DBUser>(
        'SELECT * FROM users WHERE email = $1 LIMIT 1',
        [email]
      );
      if (existing.rows.length > 0) return existing.rows[0];

      const res = await this.pool.query<DBUser>(
        'INSERT INTO users (email, display_name) VALUES ($1, $2) RETURNING *',
        [email, displayName]
      );
      const newUser = res.rows[0];
      // Init default settings
      await this.pool.query(
        `INSERT INTO user_settings (user_id, auto_scan, ai_analysis, telemetry_enabled, sensitive_page_protection, show_low_confidence, risk_notification_threshold, retention_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO NOTHING`,
        [
          newUser.id,
          DEFAULT_USER_SETTINGS.auto_scan,
          DEFAULT_USER_SETTINGS.ai_analysis,
          DEFAULT_USER_SETTINGS.telemetry_enabled,
          DEFAULT_USER_SETTINGS.sensitive_page_protection,
          DEFAULT_USER_SETTINGS.show_low_confidence,
          DEFAULT_USER_SETTINGS.risk_notification_threshold,
          DEFAULT_USER_SETTINGS.retention_days,
        ]
      );
      return newUser;
    }

    // Memory Store
    for (const u of this.memoryStore.users.values()) {
      if (u.email === email) return u;
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    const newUser: DBUser = {
      id,
      email,
      display_name: displayName,
      created_at: now,
      updated_at: now,
    };
    this.memoryStore.users.set(id, newUser);
    this.memoryStore.settings.set(id, {
      user_id: id,
      ...DEFAULT_USER_SETTINGS,
      updated_at: now,
    });
    return newUser;
  }

  // --- Settings ---
  async getUserSettings(userId: string): Promise<DBUserSettings> {
    await this.init();
    if (this.usingPostgres && this.pool) {
      const res = await this.pool.query<DBUserSettings>(
        'SELECT * FROM user_settings WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      if (res.rows.length > 0) return res.rows[0];

      // Insert default if absent
      const insert = await this.pool.query<DBUserSettings>(
        `INSERT INTO user_settings (user_id, auto_scan, ai_analysis, telemetry_enabled, sensitive_page_protection, show_low_confidence, risk_notification_threshold, retention_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          userId,
          DEFAULT_USER_SETTINGS.auto_scan,
          DEFAULT_USER_SETTINGS.ai_analysis,
          DEFAULT_USER_SETTINGS.telemetry_enabled,
          DEFAULT_USER_SETTINGS.sensitive_page_protection,
          DEFAULT_USER_SETTINGS.show_low_confidence,
          DEFAULT_USER_SETTINGS.risk_notification_threshold,
          DEFAULT_USER_SETTINGS.retention_days,
        ]
      );
      return insert.rows[0];
    }

    // Memory Store
    let settings = this.memoryStore.settings.get(userId);
    if (!settings) {
      settings = {
        user_id: userId,
        ...DEFAULT_USER_SETTINGS,
        updated_at: new Date().toISOString(),
      };
      this.memoryStore.settings.set(userId, settings);
    }
    return settings;
  }

  async updateUserSettings(
    userId: string,
    updates: Partial<Omit<DBUserSettings, 'user_id' | 'updated_at'>>
  ): Promise<DBUserSettings> {
    await this.init();
    if (this.usingPostgres && this.pool) {
      const current = await this.getUserSettings(userId);
      const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
      const res = await this.pool.query<DBUserSettings>(
        `UPDATE user_settings
         SET auto_scan = $2, ai_analysis = $3, telemetry_enabled = $4,
             sensitive_page_protection = $5, show_low_confidence = $6,
             risk_notification_threshold = $7, retention_days = $8, updated_at = NOW()
         WHERE user_id = $1
         RETURNING *`,
        [
          userId,
          updated.auto_scan,
          updated.ai_analysis,
          updated.telemetry_enabled,
          updated.sensitive_page_protection,
          updated.show_low_confidence,
          updated.risk_notification_threshold,
          updated.retention_days,
        ]
      );
      return res.rows[0];
    }

    const current = await this.getUserSettings(userId);
    const updated: DBUserSettings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.memoryStore.settings.set(userId, updated);
    return updated;
  }

  // --- Scans ---
  async createScan(
    scan: Omit<DBScan, 'id' | 'created_at'>,
    findings: Array<Omit<DBFinding, 'id' | 'scan_id' | 'created_at'>>
  ): Promise<{ scan: DBScan; findings: DBFinding[] }> {
    await this.init();
    const scanId = uuidv4();
    const now = new Date().toISOString();

    if (this.usingPostgres && this.pool) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const mode = scan.analysis_mode || 'rule_based';
        const scanRes = await client.query<DBScan>(
          `INSERT INTO scans (id, user_id, domain, page_url, page_title, page_type, risk_score, risk_level, finding_count, analysis_mode, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [
            scanId,
            scan.user_id,
            scan.domain,
            scan.page_url,
            scan.page_title,
            scan.page_type,
            scan.risk_score,
            scan.risk_level,
            findings.length,
            mode,
            now,
          ]
        );

        const insertedFindings: DBFinding[] = [];
        for (const f of findings) {
          const findingId = uuidv4();
          const fRes = await client.query<DBFinding>(
            `INSERT INTO findings (id, scan_id, category, title, severity, confidence, evidence, explanation, potential_impact, recommendation, source_element, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [
              findingId,
              scanId,
              f.category,
              f.title,
              f.severity,
              f.confidence,
              f.evidence,
              f.explanation,
              f.potential_impact,
              f.recommendation,
              f.source_element || '',
              now,
            ]
          );
          insertedFindings.push(fRes.rows[0]);
        }
        await client.query('COMMIT');
        return { scan: scanRes.rows[0], findings: insertedFindings };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    // Memory Store
    const newScan: DBScan = {
      id: scanId,
      ...scan,
      finding_count: findings.length,
      created_at: now,
    };
    this.memoryStore.scans.set(scanId, newScan);

    const insertedFindings: DBFinding[] = findings.map((f) => {
      const fId = uuidv4();
      const rec: DBFinding = {
        id: fId,
        scan_id: scanId,
        ...f,
        source_element: f.source_element || '',
        created_at: now,
      };
      this.memoryStore.findings.set(fId, rec);
      return rec;
    });

    return { scan: newScan, findings: insertedFindings };
  }

  async getScans(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ scans: DBScan[]; total: number }> {
    await this.init();
    if (this.usingPostgres && this.pool) {
      const countRes = await this.pool.query<{ count: string }>(
        'SELECT count(*) FROM scans WHERE user_id = $1',
        [userId]
      );
      const total = parseInt(countRes.rows[0]?.count || '0', 10);

      const rows = await this.pool.query<DBScan>(
        'SELECT * FROM scans WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );
      return { scans: rows.rows, total };
    }

    // Memory Store
    const userScans = Array.from(this.memoryStore.scans.values())
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = userScans.length;
    const paginated = userScans.slice(offset, offset + limit);
    return { scans: paginated, total };
  }

  async getScanById(
    userId: string,
    scanId: string
  ): Promise<{ scan: DBScan; findings: DBFinding[] } | null> {
    await this.init();
    if (this.usingPostgres && this.pool) {
      const scanRes = await this.pool.query<DBScan>(
        'SELECT * FROM scans WHERE id = $1 AND user_id = $2 LIMIT 1',
        [scanId, userId]
      );
      if (scanRes.rows.length === 0) return null;

      const findingsRes = await this.pool.query<DBFinding>(
        'SELECT * FROM findings WHERE scan_id = $1 ORDER BY created_at ASC',
        [scanId]
      );
      return { scan: scanRes.rows[0], findings: findingsRes.rows };
    }

    const scan = this.memoryStore.scans.get(scanId);
    if (!scan || scan.user_id !== userId) return null;

    const findings = Array.from(this.memoryStore.findings.values()).filter(
      (f) => f.scan_id === scanId
    );
    return { scan, findings };
  }

  async deleteScan(userId: string, scanId: string): Promise<boolean> {
    await this.init();
    if (this.usingPostgres && this.pool) {
      const res = await this.pool.query(
        'DELETE FROM scans WHERE id = $1 AND user_id = $2',
        [scanId, userId]
      );
      return (res.rowCount ?? 0) > 0;
    }

    const scan = this.memoryStore.scans.get(scanId);
    if (!scan || scan.user_id !== userId) return false;

    // Cascade delete findings and feedback
    this.memoryStore.scans.delete(scanId);
    for (const [fId, f] of this.memoryStore.findings.entries()) {
      if (f.scan_id === scanId) {
        this.memoryStore.findings.delete(fId);
      }
    }
    return true;
  }

  async deleteAllUserData(userId: string): Promise<void> {
    await this.init();
    if (this.usingPostgres && this.pool) {
      await this.pool.query('DELETE FROM scans WHERE user_id = $1', [userId]);
      await this.pool.query('DELETE FROM feedback WHERE user_id = $1', [userId]);
      return;
    }

    for (const [sId, s] of this.memoryStore.scans.entries()) {
      if (s.user_id === userId) {
        this.memoryStore.scans.delete(sId);
        for (const [fId, f] of this.memoryStore.findings.entries()) {
          if (f.scan_id === sId) this.memoryStore.findings.delete(fId);
        }
      }
    }
    for (const [fbId, fb] of this.memoryStore.feedback.entries()) {
      if (fb.user_id === userId) this.memoryStore.feedback.delete(fbId);
    }
  }

  // --- Feedback ---
  async addFeedback(
    userId: string,
    findingId: string,
    feedbackType: string,
    notes?: string
  ): Promise<DBFeedback> {
    await this.init();
    const id = uuidv4();
    const now = new Date().toISOString();

    if (this.usingPostgres && this.pool) {
      const res = await this.pool.query<DBFeedback>(
        `INSERT INTO feedback (id, user_id, finding_id, feedback_type, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, finding_id) DO UPDATE
         SET feedback_type = EXCLUDED.feedback_type, notes = EXCLUDED.notes
         RETURNING *`,
        [id, userId, findingId, feedbackType, notes || null, now]
      );
      return res.rows[0];
    }

    const rec: DBFeedback = {
      id,
      user_id: userId,
      finding_id: findingId,
      feedback_type: feedbackType,
      notes,
      created_at: now,
    };
    this.memoryStore.feedback.set(id, rec);
    return rec;
  }
}

export const db = new DatabaseService();
