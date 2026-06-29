-- Migration: SKU Categories and SKU Catalogue

CREATE TABLE IF NOT EXISTS public.sku_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    default_unit VARCHAR(20) NOT NULL DEFAULT 'units',
    default_shelf_life_days INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.sku_categories IS 'Relief item categories (Food, Shelter, Medical, etc.)';

CREATE TABLE IF NOT EXISTS public.skus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category_id UUID NOT NULL REFERENCES public.sku_categories(id) ON DELETE RESTRICT,
    description TEXT,
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'units',
    weight_kg DECIMAL(10, 3),
    volume_m3 DECIMAL(10, 6),
    shelf_life_days INTEGER,
    hazard_class VARCHAR(50),
    image_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.skus IS 'Master catalogue of stock keeping units';

CREATE INDEX IF NOT EXISTS idx_skus_category_id ON public.skus(category_id);
CREATE INDEX IF NOT EXISTS idx_skus_active ON public.skus(is_active);

CREATE TRIGGER sku_categories_updated_at
    BEFORE UPDATE ON public.sku_categories
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER skus_updated_at
    BEFORE UPDATE ON public.skus
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
