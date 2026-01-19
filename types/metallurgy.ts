import { ID, ISO8601Date } from './common.ts';
import { QualityStatus } from './enums.ts';

export interface ChemicalComposition {
  carbon: number;
  manganese: number;
  silicon: number;
  phosphorus: number;
  sulfur: number;
}

export interface MechanicalProperties {
  yieldStrength: number;
  tensileStrength: number;
  elongation: number;
}

export interface SteelBatchMetadata {
  batchNumber: string;
  grade: string;
  invoiceNumber: string;
  
  customFlags?: string[];
  currentStep: number;
  
  // Etapa 1: Liberação Vital
  releasedAt?: ISO8601Date;
  releasedBy?: string;

  // Etapa 2: Conferência Documental Independente
  documentalStatus?: QualityStatus;
  documentalNotes?: string;
  documentalUnlockedAt?: ISO8601Date;
  documentalUnlockedBy?: string;
  documentalVersion?: number;

  // Etapa 3: Conferência Física Independente
  physicalStatus?: QualityStatus;
  physicalNotes?: string;
  physicalUnlockedAt?: ISO8601Date;
  physicalUnlockedBy?: string;
  physicalVersion?: number;

  // Metadados de interação
  clientObservations?: string;
  viewedAt?: ISO8601Date;
  lastClientInteractionAt?: string;
  lastClientInteractionBy?: string;

  // Etapa 4: Mediação Técnica
  remediationReply?: string;
  remediatedAt?: ISO8601Date;
  remediatedBy?: string;

  // Etapa 5: Veredito Final
  finalPartnerVerdict?: QualityStatus;
  finalVerdictAt?: ISO8601Date;

  // Global
  status: QualityStatus;
  chemicalComposition: ChemicalComposition;
  mechanicalProperties: MechanicalProperties;
  rejectionReason?: string;

  // FIX: Added missing properties for inspection traceability
  inspectedAt?: ISO8601Date;
  inspectedBy?: string;
}
