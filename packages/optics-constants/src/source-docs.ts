/**
 * Paths to the primary research and verification documents.
 *
 * @remarks Not consumed by runtime code — the same references appear inline
 * in JSDoc `Source ref:` comments. Use for tooling, generated documentation,
 * or automated cross-referencing of optics derivations back to their source
 * material.
 */
export const RESEARCH_DOCS = {
  concept: "docs/optics_poc_concept.md",
  buildSpec: "docs/phase_0_3_build_spec.md",
  validationPlan: "docs/poc_e2e_validation_plan.md",
  verification: "docs/equation_source_verification_notes.md",
} as const;

/**
 * Structured pointers to specific sections within research documents.
 *
 * @remarks Same intent as `RESEARCH_DOCS` — a machine-readable index of
 * every derivation's source location. Useful for generating traceability
 * matrices or verifying that source refs in JSDoc stay in sync with the docs.
 */
export const RESEARCH_REFERENCES = {
  airyDiskLimit: `${RESEARCH_DOCS.verification}:8. Diffraction sanity check`,
  analyticDiskOtf: `${RESEARCH_DOCS.verification}:5. Disk OTF first zero`,
  astigmaticMeridionalPower: `${RESEARCH_DOCS.verification}:7. Meridional power and astigmatism`,
  blurEquationChain: `${RESEARCH_DOCS.concept}:Optical Contract`,
  focusModes: `${RESEARCH_DOCS.concept}:Focus Modes`,
  pillboxPsf: `${RESEARCH_DOCS.verification}:4. Spherical defocus PSF`,
  pocScope: `${RESEARCH_DOCS.concept}:Current Scope`,
  validationThresholds: `${RESEARCH_DOCS.buildSpec}:Phase 2`,
  warningModel: `${RESEARCH_DOCS.buildSpec}:Data Contracts`,
  wienerBaseline: `${RESEARCH_DOCS.verification}:6. Wiener regularization`,
} as const;
