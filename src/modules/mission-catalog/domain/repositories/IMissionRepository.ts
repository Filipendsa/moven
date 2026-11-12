import { Mission } from "../entities/Mission";

export interface IMissionRepository {
  save(mission: Mission): Promise<void>;
  findById(id: string): Promise<Mission | null>;
  findBySlug(slug: string): Promise<Mission | null>;
  findFeatured(): Promise<Mission | null>;
  listAll(): Promise<Mission[]>;
  listActive(): Promise<Mission[]>;
  setFeatured(id: string): Promise<void>;
}

