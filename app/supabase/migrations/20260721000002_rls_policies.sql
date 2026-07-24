-- ============================================
-- RETEA - Row Level Security (RLS) Policies
-- ============================================
-- Sprint 1-2: Fundación - Seguridad
-- Fecha: 2026-07-21
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user role
CREATE OR REPLACE FUNCTION auth.role()
RETURNS VARCHAR AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- Check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE;

-- Check if user is installer
CREATE OR REPLACE FUNCTION auth.is_installer()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'installer'
  );
$$ LANGUAGE SQL STABLE;

-- Check if user is client
CREATE OR REPLACE FUNCTION auth.is_client()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'client'
  );
$$ LANGUAGE SQL STABLE;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Anyone can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY profiles_select_admin ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Only admins can insert profiles (registration handled by trigger)
CREATE POLICY profiles_insert_admin ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.is_admin());

-- ============================================
-- CAMPAIGNS POLICIES
-- ============================================

-- Admins can do everything with campaigns
CREATE POLICY campaigns_admin_all ON campaigns
  FOR ALL
  TO authenticated
  USING (auth.is_admin());

-- Clients can view their own campaigns
CREATE POLICY campaigns_select_client ON campaigns
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid() AND auth.is_client());

-- Installers can view campaigns where they have assigned points
CREATE POLICY campaigns_select_installer ON campaigns
  FOR SELECT
  TO authenticated
  USING (
    auth.is_installer() AND
    EXISTS (
      SELECT 1 FROM installation_points
      WHERE campaign_id = campaigns.id
        AND assigned_to = auth.uid()
    )
  );

-- ============================================
-- INSTALLATION POINTS POLICIES
-- ============================================

-- Admins can do everything with points
CREATE POLICY points_admin_all ON installation_points
  FOR ALL
  TO authenticated
  USING (auth.is_admin());

-- Clients can view points from their campaigns
CREATE POLICY points_select_client ON installation_points
  FOR SELECT
  TO authenticated
  USING (
    auth.is_client() AND
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = installation_points.campaign_id
        AND campaigns.client_id = auth.uid()
    )
  );

-- Installers can view their assigned points
CREATE POLICY points_select_installer ON installation_points
  FOR SELECT
  TO authenticated
  USING (
    auth.is_installer() AND
    assigned_to = auth.uid()
  );

-- Installers can update status of their assigned points
CREATE POLICY points_update_installer ON installation_points
  FOR UPDATE
  TO authenticated
  USING (
    auth.is_installer() AND
    assigned_to = auth.uid()
  )
  WITH CHECK (
    auth.is_installer() AND
    assigned_to = auth.uid()
  );

-- ============================================
-- INSTALLATION EVIDENCES POLICIES
-- ============================================

-- Admins can do everything with evidences
CREATE POLICY evidences_admin_all ON installation_evidences
  FOR ALL
  TO authenticated
  USING (auth.is_admin());

-- Clients can view evidences from their campaigns
CREATE POLICY evidences_select_client ON installation_evidences
  FOR SELECT
  TO authenticated
  USING (
    auth.is_client() AND
    EXISTS (
      SELECT 1 FROM installation_points ip
      JOIN campaigns c ON c.id = ip.campaign_id
      WHERE ip.id = installation_evidences.point_id
        AND c.client_id = auth.uid()
    )
  );

-- Installers can view evidences from their points
CREATE POLICY evidences_select_installer ON installation_evidences
  FOR SELECT
  TO authenticated
  USING (
    auth.is_installer() AND
    EXISTS (
      SELECT 1 FROM installation_points
      WHERE installation_points.id = installation_evidences.point_id
        AND installation_points.assigned_to = auth.uid()
    )
  );

-- Installers can insert evidences for their points
CREATE POLICY evidences_insert_installer ON installation_evidences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.is_installer() AND
    EXISTS (
      SELECT 1 FROM installation_points
      WHERE installation_points.id = point_id
        AND installation_points.assigned_to = auth.uid()
    )
  );

-- Installers can update evidences for their points (before approval)
CREATE POLICY evidences_update_installer ON installation_evidences
  FOR UPDATE
  TO authenticated
  USING (
    auth.is_installer() AND
    approved_at IS NULL AND
    EXISTS (
      SELECT 1 FROM installation_points
      WHERE installation_points.id = installation_evidences.point_id
        AND installation_points.assigned_to = auth.uid()
    )
  );

-- ============================================
-- CONTRACTS POLICIES
-- ============================================

-- Admins can view all contracts
CREATE POLICY contracts_select_admin ON contracts
  FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- Installers can view their own contracts
CREATE POLICY contracts_select_installer ON contracts
  FOR SELECT
  TO authenticated
  USING (
    auth.is_installer() AND
    installer_id = auth.uid()
  );

-- Installers can create their own contracts
CREATE POLICY contracts_insert_installer ON contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.is_installer() AND
    installer_id = auth.uid()
  );

-- Clients can view contracts for their campaigns
CREATE POLICY contracts_select_client ON contracts
  FOR SELECT
  TO authenticated
  USING (
    auth.is_client() AND
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = contracts.campaign_id
        AND campaigns.client_id = auth.uid()
    )
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System/Admins can insert notifications for any user
CREATE POLICY notifications_insert_admin ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.is_admin());

-- ============================================
-- STORAGE POLICIES (para fotos de evidencias)
-- ============================================

-- Bucket: installation-evidences
-- Estructura: {campaign_id}/{point_id}/{filename}

-- Crear bucket (ejecutar manualmente en Supabase Dashboard o CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('installation-evidences', 'installation-evidences', false);

-- Installers can upload to their assigned points
CREATE POLICY "Installers can upload evidence photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'installation-evidences' AND
    auth.is_installer() AND
    -- Verificar que el instalador tiene asignado este punto
    EXISTS (
      SELECT 1 FROM installation_points
      WHERE installation_points.id::text = (storage.foldername(name))[2]
        AND installation_points.assigned_to = auth.uid()
    )
  );

-- Anyone involved can view evidence photos
CREATE POLICY "View evidence photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'installation-evidences' AND
    (
      -- Admin can see all
      auth.is_admin() OR
      -- Installer can see their own
      (
        auth.is_installer() AND
        EXISTS (
          SELECT 1 FROM installation_points
          WHERE installation_points.id::text = (storage.foldername(name))[2]
            AND installation_points.assigned_to = auth.uid()
        )
      ) OR
      -- Client can see their campaigns
      (
        auth.is_client() AND
        EXISTS (
          SELECT 1 FROM installation_points ip
          JOIN campaigns c ON c.id = ip.campaign_id
          WHERE ip.id::text = (storage.foldername(name))[2]
            AND c.client_id = auth.uid()
        )
      )
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION auth.role() IS 'Returns the role of the current authenticated user';
COMMENT ON FUNCTION auth.is_admin() IS 'Check if current user is admin';
COMMENT ON FUNCTION auth.is_installer() IS 'Check if current user is installer';
COMMENT ON FUNCTION auth.is_client() IS 'Check if current user is client';
