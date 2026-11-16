# Research hypothesis: independently verifiable generated mechanisms

**Unsolved workflow in this prototype:** The design generator and verifier previously trusted the same solver's residuals; a corrupted pose/output trace could be ranked without an independent geometric consistency check.

**Hypothesis H1 (falsifiable):** A separate geometry evaluator can reject injected 1.5 mm joint-pose perturbations, 0.05 rad driver errors and 2 mm output-trace errors in both four-bar and slider-crank families, while accepting unmodified solver traces within 0.01 mm and 0.00025 rad.

**Metric:** Number of corrupted traces detected / number injected; false rejections on clean traces; per-frame maximum R/P joint residual and driver error. The deterministic regression must detect all 6 corruptions and accept 2 clean trajectories. A future multi-seed run must report full distribution and near-singularity cases.

**Prior art and novelty boundary:** Classical loop-closure equations and independent kinematic verification are established practice, not novel. Relevant references: [Norton, Design of Machinery (McGraw-Hill)](https://www.mheducation.com/highered/product/design-machinery-norton/M9781260431307.html), [OpenModelica](https://openmodelica.org/), [Project Chrono](https://projectchrono.org/), [Onshape simulation](https://www.onshape.com/en/features/simulation). Product capabilities and current license terms require separate verification; these links are context, not evidence of a world-first claim. The possible future innovation would be an experimentally validated closed-loop system that proposes, builds, measures and revises mechanisms under physical constraints. That system does **not** exist yet.

**Scope:** Planar, ideal, synthetic trajectories. No force, stress, friction, collision clearance, manufacturing validation, patent clearance or physical experimentation. Geometric checks share graph input data and cannot detect incorrect ground-truth dimensions.
