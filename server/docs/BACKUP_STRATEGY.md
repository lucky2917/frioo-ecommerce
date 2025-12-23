# Frioo E-Commerce App - Backup & Disaster Recovery Strategy

**Document Version:** 1.0  
**Last Updated:** December 23, 2025  
**Owner:** DevOps/Backend Team

---

## 📋 Overview

This document outlines the backup strategy, disaster recovery procedures, and data protection measures for the Frioo E-Commerce application using Supabase as the database provider.

---

## 🎯 Backup Objectives

- **RPO (Recovery Point Objective):** ≤ 5 minutes
- **RTO (Recovery Time Objective):** ≤ 30 minutes
- **Data Retention:** 30 days minimum
- **Backup Frequency:** Continuous (PITR) + Daily snapshots

---

## 🗄️ Supabase Automatic Backups

### Default Backup Configuration

Supabase provides **automatic daily backups** for all projects:

| Plan | Backup Frequency | Retention | PITR Available |
|------|------------------|-----------|----------------|
| Free | Daily | 7 days | ❌ No |
| Pro | Daily | 30 days | ✅ Yes |
| Team/Enterprise | Daily | 90+ days | ✅ Yes |

### What Gets Backed Up

✅ **Included:**
- All database tables (`profiles`, `products`, `orders`, `coupons`)
- User data and authentication records
- Row Level Security (RLS) policies
- Database functions and triggers
- Table indexes

❌ **NOT Included:**
- Supabase Storage files (backed up separately)
- Auth provider configurations
- Edge Functions

---

## ⚡ Point-in-Time Recovery (PITR)

### Enable PITR (Recommended)

**Requirements:** Pro plan or higher

**Steps to Enable:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **Database**
4. Scroll to **Point-in-Time Recovery**
5. Click **Enable PITR**
6. Confirm the action

**What PITR Provides:**
- Restore to any point in the last 7-30 days (plan-dependent)
- Granular recovery (by the minute)
- No data loss between daily backups

**Use Cases:**
- Recover from accidental DELETE statements
- Restore after bad data migration
- Rollback after application bug corrupts data

---

## 💾 Manual Backup Procedures

### Option 1: pg_dump (Recommended for Dev/Test)

**Full Database Backup:**
```bash
# Set environment variables
export SUPABASE_DB_HOST="db.xxxxxxxxxxxxx.supabase.co"
export PGPASSWORD="your-database-password"

# Create backup
pg_dump \
  --host=$SUPABASE_DB_HOST \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file=frioo_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh frioo_backup_*.sql
```

**Schema-Only Backup:**
```bash
pg_dump \
  --host=$SUPABASE_DB_HOST \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --schema-only \
  --file=frioo_schema_$(date +%Y%m%d).sql
```

**Data-Only Backup:**
```bash
pg_dump \
  --host=$SUPABASE_DB_HOST \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --data-only \
  --file=frioo_data_$(date +%Y%m%d).sql
```

### Option 2: Supabase CLI (Recommended for Automation)

**Install Supabase CLI:**
```bash
npm install -g supabase
```

**Backup Command:**
```bash
supabase db dump --db-url "postgresql://postgres:[password]@[host]:5432/postgres" > backup.sql
```

### Option 3: Supabase Dashboard (Quick Manual Backup)

1. Go to **Database** → **Backups**
2. Click **Create Backup**
3. Add description (e.g., "Pre-deployment backup")
4. Click **Create**

---

## 🔄 Automated Backup Schedule

### Recommended Backup Strategy

```plaintext
┌─────────────────┬──────────────┬─────────────┬────────────┐
│ Backup Type     │ Frequency    │ Retention   │ Method     │
├─────────────────┼──────────────┼─────────────┼────────────┤
│ PITR            │ Continuous   │ 30 days     │ Supabase   │
│ Daily Snapshot  │ Daily 2 AM   │ 30 days     │ Supabase   │
│ Weekly Export   │ Sunday 3 AM  │ 90 days     │ pg_dump    │
│ Pre-deployment  │ On-demand    │ 7 days      │ Manual     │
└─────────────────┴──────────────┴─────────────┴────────────┘
```

### GitHub Actions Backup Automation (Optional)

Create `.github/workflows/database-backup.yml`:

```yaml
name: Weekly Database Backup

on:
  schedule:
    - cron: '0 3 * * 0' # Every Sunday at 3 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Install PostgreSQL Client
        run: sudo apt-get install postgresql-client
      
      - name: Create Backup
        env:
          PGPASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          pg_dump \
            --host=${{ secrets.SUPABASE_DB_HOST }} \
            --port=5432 \
            --username=postgres \
            --dbname=postgres \
            --clean \
            --if-exists \
            --file=backup_$(date +%Y%m%d).sql
      
      - name: Upload to S3/GCS
        # Add your cloud storage upload here
        run: echo "Upload backup to secure storage"
```

---

## 🚨 Disaster Recovery Procedures

### Scenario 1: Accidental Data Deletion

**Symptoms:** User reports missing data, recent DELETE queries in logs

**Recovery Steps:**
1. **Stop Application Immediately**
   ```bash
   # Set maintenance mode
   export MAINTENANCE_MODE=true
   ```

2. **Identify Deletion Time**
   - Check Supabase logs: Database → Logs
   - Note exact timestamp of deletion

3. **Restore via PITR**
   - Dashboard → Database → Backups
   - Click **Restore to Point in Time**
   - Select time *before* deletion
   - Click **Restore**
   - Wait 5-15 minutes for restoration

4. **Verify Data**
   ```sql
   SELECT COUNT(*) FROM orders; -- Check counts
   SELECT * FROM profiles WHERE id = 'affected_user_id';
   ```

5. **Resume Application**
   ```bash
   unset MAINTENANCE_MODE
   ```

**Estimated Downtime:** 15-30 minutes

---

### Scenario 2: Database Corruption

**Symptoms:** Application errors, query failures, inconsistent data

**Recovery Steps:**
1. **Create Emergency Backup**
   ```bash
   pg_dump ... > emergency_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Restore from Last Known Good Backup**
   - Dashboard → Database → Backups
   - Select most recent *successful* backup
   - Click **Restore**

3. **Apply Missing Transactions** (if using PITR)
   - Use PITR to recover data between backup and corruption

4. **Verify Integrity**
   ```sql
   -- Check constraints
   SELECT * FROM pg_constraint WHERE conname LIKE 'frioo%';
   
   -- Verify indexes
   SELECT tablename, indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public';
   ```

**Estimated Downtime:** 30-60 minutes

---

### Scenario 3: Complete Database Loss

**Symptoms:** Supabase project inaccessible, total outage

**Recovery Steps:**
1. **Create New Supabase Project**
   - Dashboard → New Project
   - Use same region as original

2. **Restore from Latest Manual Backup**
   ```bash
   psql \
     --host=new-db.supabase.co \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     < frioo_backup_latest.sql
   ```

3. **Update Environment Variables**
   ```bash
   # Server .env
   SUPABASE_URL=https://newproject.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=new_service_key
   
   # Client .env
   VITE_SUPABASE_URL=https://newproject.supabase.co
   VITE_SUPABASE_ANON_KEY=new_anon_key
   ```

4. **Redeploy Application**
   ```bash
   git push production main
   ```

5. **Verify Data Completeness**
   ```sql
   SELECT 
     'profiles' as table_name, COUNT(*) as count FROM profiles
   UNION ALL
   SELECT 'products', COUNT(*) FROM products
   UNION ALL
   SELECT 'orders', COUNT(*) FROM orders;
   ```

**Estimated Downtime:** 2-4 hours

---

## 🔐 Backup Security

### Encryption
- ✅ **At Rest:** Supabase encrypts all backups with AES-256
- ✅ **In Transit:** All backup transfers use TLS 1.2+
- ⚠️ **Manual Backups:** Encrypt before uploading to external storage

**Encrypt Manual Backup:**
```bash
# Encrypt backup file
gpg --symmetric --cipher-algo AES256 frioo_backup.sql

# Decrypt when needed
gpg --decrypt frioo_backup.sql.gpg > frioo_backup.sql
```

### Access Control
- Limit database credentials to authorized personnel only
- Use environment-specific passwords (dev/staging/prod)
- Rotate passwords quarterly
- Store credentials in secure vault (1Password, AWS Secrets Manager)

---

## ✅ Backup Testing & Validation

### Monthly Restoration Test

**Schedule:** First Monday of each month  
**Duration:** 30 minutes

**Test Procedure:**
1. Create test Supabase project
2. Restore latest backup to test project
3. Run validation queries:
   ```sql
   -- Count all records
   SELECT 
     (SELECT COUNT(*) FROM profiles) as profiles_count,
     (SELECT COUNT(*) FROM products) as products_count,
     (SELECT COUNT(*) FROM orders) as orders_count,
     (SELECT COUNT(*) FROM coupons) as coupons_count;
   
   -- Verify critical data
   SELECT * FROM products WHERE featured = true LIMIT 5;
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
   ```
4. Test application connection to restored database
5. Document results in backup test log
6. Delete test project

**Success Criteria:**
- ✅ All record counts match expected values
- ✅ Application connects successfully
- ✅ Sample queries return valid data
- ✅ RLS policies enforced correctly

---

## 📊 Monitoring & Alerts

### Backup Health Checks

**Monitor:**
- Daily backup completion status
- PITR lag time (<5 minutes)
- Backup file sizes (should be consistent)
- Storage quota usage

**Set Alerts For:**
- ❌ Failed daily backup (critical)
- ⚠️ Backup size deviation >20% (warning)
- ⚠️ Storage quota >80% (warning)
- ⚠️ PITR lag >10 minutes (warning)

**Notification Channels:**
- Email: devops@frioo.com
- Slack: #alerts-production
- PagerDuty: On-call engineer

---

## 📝 Backup Checklist

### Pre-Deployment Backup
- [ ] Create manual backup via Dashboard
- [ ] Export backup file with pg_dump
- [ ] Verify backup file integrity
- [ ] Store backup securely (S3/GCS)
- [ ] Tag backup with deployment version
- [ ] Document backup location in deployment notes

### Weekly Maintenance
- [ ] Review backup logs in Supabase Dashboard
- [ ] Verify PITR is functioning
- [ ] Check storage quota usage
- [ ] Test sample backup restoration
- [ ] Update backup retention policy if needed

### Monthly Review
- [ ] Perform full restoration test
- [ ] Review and update disaster recovery procedures
- [ ] Audit backup access logs
- [ ] Verify encryption keys are secure
- [ ] Update backup documentation

---

## 🔗 Quick Reference Links

**Supabase Documentation:**
- [Database Backups](https://supabase.com/docs/guides/platform/backups)
- [PITR Guide](https://supabase.com/docs/guides/database/point-in-time-recovery)
- [Database CLI](https://supabase.com/docs/guides/cli/config)

**Internal Resources:**
- Production Dashboard: https://app.supabase.com/project/[PROJECT_ID]
- Backup Storage: [Your S3/GCS bucket]
- Runbook: `/docs/runbooks/database-recovery.md`

---

## 📞 Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Database Admin | devops@frioo.com | 24/7 |
| Supabase Support | support@supabase.io | 24/7 (Pro plan) |
| On-Call Engineer | PagerDuty | 24/7 |

---

## 📄 Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-23 | Initial backup strategy | Antigravity AI |

---

**Next Review Date:** 2026-01-23  
**Document Owner:** DevOps Team  
**Approval Status:** ✅ Approved for Production
