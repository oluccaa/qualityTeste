
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
  
  // Controle de Fluxo
  currentStep: number;
  
  // Etapa 1: Liberação Técnica Vital
  releasedAt?: ISO8601Date;
  releasedBy?: string;

  // Etapa 2: Conferência Documental
  documentalStatus?: QualityStatus;
  documentalNotes?: string;
  documentalFlags?: string[];
  documentalDrawings?: string; // Base64 do canvas de auditoria

  // Etapa 3: Conferência Física
  physicalStatus?: QualityStatus;
  physicalNotes?: string;
  physicalFlags?: string[];
  physicalPhotos?: string[]; // URLs das fotos de evidência

  // Metadados de interação do cliente
  clientObservations?: string;
  viewedAt?: ISO8601Date;
  lastClientInteractionAt?: string;
  lastClientInteractionBy?: string;

  // Etapa 4: Mediação Técnica Vital
  remediationReply?: string;
  remediatedAt?: ISO8601Date;
  remediatedBy?: string;

  // Etapa 5: Veredito Final do Parceiro
  finalPartnerVerdict?: QualityStatus;
  finalVerdictAt?: ISO8601Date;

  // Global
  status: QualityStatus;
  chemicalComposition: ChemicalComposition;
  mechanicalProperties: MechanicalProperties;
  rejectionReason?: string;
  inspectedAt?: ISO8601Date;
  inspectedBy?: string;
}
