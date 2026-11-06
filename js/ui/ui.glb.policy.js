// Candidate policy shared by declared-scene and post-decode admission.
// Does not alter geometry accounting, decoder memory or output budgets.
export const GLB_DRACO_WORK_LIMITS = Object.freeze({draws:2048,triangles:3000000});
