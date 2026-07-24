-- ============================================
-- RETEA - Initial Database Schema
-- Marketplace de Campañas de Instalación
-- ============================================
-- Sprint 1-2: Fundación
-- Fecha: 2026-07-21
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase Auth)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('admin', 'installer', 'client')),

  -- Company info
  company_name VARCHAR,
  cif VARCHAR,
  phone VARCHAR,

  -- Installer specific
  provinces JSONB, -- ["Madrid", "Toledo"] (solo instaladores)

  -- Legal
  nda_signed_at TIMESTAMP,
  contract_version VARCHAR DEFAULT 'v1.0',

  -- Status
  active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CAMPAIGNS
-- ============================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Pricing
  price_per_install DECIMAL(10,2) NOT NULL,

  -- Status
  status VARCHAR NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),

  -- Metadata
  description TEXT,
  total_points INTEGER DEFAULT 0,
  completed_points INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INSTALLATION POINTS
-- ============================================

CREATE TABLE installation_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Address info
  address VARCHAR NOT NULL,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  province VARCHAR,
  postal_code VARCHAR,

  -- Contact
  contact_name VARCHAR,
  contact_phone VARCHAR,
  contact_email VARCHAR,

  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP,

  -- Status flow:
  -- pending → assigned → accepted → in_progress → completed → approved
  -- También: rejected, rejected_evidence
  status VARCHAR NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'assigned', 'accepted', 'rejected',
      'in_progress', 'completed', 'approved', 'rejected_evidence'
    )),

  -- Tracking
  tracking_number VARCHAR UNIQUE,

  -- Rejection
  rejection_reason TEXT,
  rejection_date TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INSTALLATION EVIDENCES
-- ============================================

CREATE TABLE installation_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id UUID REFERENCES installation_points(id) ON DELETE CASCADE,

  -- Photos (required)
  photo_before_url VARCHAR NOT NULL,
  photo_during_url VARCHAR,
  photo_after_url VARCHAR NOT NULL,

  -- Optional
  signature_url VARCHAR,
  notes TEXT,

  -- Geolocation at upload
  upload_lat DECIMAL(10,8),
  upload_lng DECIMAL(11,8),

  -- Approval
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES profiles(id),

  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CONTRACTS (Digital agreements)
-- ============================================

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Accepted points (array de UUIDs)
  accepted_points JSONB NOT NULL,

  -- Legal tracking
  accepted_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR,
  user_agent TEXT,
  contract_version VARCHAR DEFAULT 'v1.0',

  -- Contract hash for verification
  contract_hash VARCHAR,

  UNIQUE(installer_id, campaign_id) -- Un contrato por campaña
);

-- ============================================
-- NOTIFICATIONS (Sistema de notificaciones)
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Type
  type VARCHAR NOT NULL CHECK (type IN (
    'assignment', 'acceptance', 'rejection', 'evidence_uploaded',
    'evidence_approved', 'evidence_rejected', 'payment_ready'
  )),

  -- Content
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,

  -- Related entities
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  point_id UUID REFERENCES installation_points(id) ON DELETE CASCADE,

  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  -- Email sent
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES (Performance optimization)
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_active ON profiles(active);

-- Campaigns
CREATE INDEX idx_campaigns_client ON campaigns(client_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

-- Installation Points
CREATE INDEX idx_points_campaign ON installation_points(campaign_id);
CREATE INDEX idx_points_status ON installation_points(status);
CREATE INDEX idx_points_assigned ON installation_points(assigned_to);
CREATE INDEX idx_points_province ON installation_points(province);
CREATE INDEX idx_points_tracking ON installation_points(tracking_number);

-- Evidences
CREATE INDEX idx_evidences_point ON installation_evidences(point_id);
CREATE INDEX idx_evidences_uploaded ON installation_evidences(uploaded_at);

-- Contracts
CREATE INDEX idx_contracts_installer ON contracts(installer_id);
CREATE INDEX idx_contracts_campaign ON contracts(campaign_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================
-- FUNCTIONS (Utility functions)
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_points_updated_at
  BEFORE UPDATE ON installation_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update campaign totals
CREATE OR REPLACE FUNCTION update_campaign_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns
  SET
    total_points = (
      SELECT COUNT(*)
      FROM installation_points
      WHERE campaign_id = NEW.campaign_id
    ),
    completed_points = (
      SELECT COUNT(*)
      FROM installation_points
      WHERE campaign_id = NEW.campaign_id
        AND status IN ('completed', 'approved')
    )
  WHERE id = NEW.campaign_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for campaign totals
CREATE TRIGGER update_campaign_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON installation_points
  FOR EACH ROW EXECUTE FUNCTION update_campaign_totals();

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase Auth';
COMMENT ON TABLE campaigns IS 'Installation campaigns created by clients';
COMMENT ON TABLE installation_points IS 'Individual installation points within a campaign';
COMMENT ON TABLE installation_evidences IS 'Photo evidence of completed installations';
COMMENT ON TABLE contracts IS 'Digital contracts between installers and campaigns';
COMMENT ON TABLE notifications IS 'System notifications for users';

COMMENT ON COLUMN installation_points.status IS 'Status flow: pending → assigned → accepted → in_progress → completed → approved';
COMMENT ON COLUMN profiles.provinces IS 'Array of provinces where installer operates (JSON array)';
