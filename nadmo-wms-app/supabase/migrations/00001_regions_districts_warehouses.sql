-- Migration: Regions, Districts, and Warehouses
-- Creates the core location hierarchy for NADMO-WMS

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Regions table
CREATE TABLE IF NOT EXISTS public.regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    capital VARCHAR(100) NOT NULL,
    geo_boundary GEOGRAPHY(MULTIPOLYGON, 4326),
    risk_profile JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.regions IS 'Ghana administrative regions';

-- Districts table
CREATE TABLE IF NOT EXISTS public.districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capital VARCHAR(100) NOT NULL,
    geo_boundary GEOGRAPHY(MULTIPOLYGON, 4326),
    population INTEGER,
    vulnerability_index DECIMAL(4,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(region_id, name)
);

COMMENT ON TABLE public.districts IS 'Ghana districts (MMDAs)';

-- Warehouses table
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('hq', 'regional', 'district')),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    manager_id UUID,
    capacity_m3 DECIMAL(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'limited', 'closed')),
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.warehouses IS 'NADMO warehouses across Ghana';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_districts_region_id ON public.districts(region_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_district_id ON public.warehouses(district_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_type ON public.warehouses(type);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON public.warehouses(status);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER regions_updated_at
    BEFORE UPDATE ON public.regions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER districts_updated_at
    BEFORE UPDATE ON public.districts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER warehouses_updated_at
    BEFORE UPDATE ON public.warehouses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
