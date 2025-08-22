# Actuarial Toolkit

## Overview
This project models how lifestyle factors and preventive screenings influence life expectancy. The app now consists of only three runtime files:

- `index.html` – markup and user interface.
- `style.css` – all styles for layout and components.
- `script.js` – bundled JavaScript containing datasets, UI logic, and the longevity model.

## Hazard‑ratio model in detail
1. **Baseline hazards** – Mortality probabilities (`qx`) are taken from the 2022 U.S. life table. For example, a 35‑year‑old female has an annual mortality probability `qx = 0.00102` (≈0.10%). These are converted to instantaneous hazards `µ` via `µ = -ln(1 - qx)`.
2. **Behavioral multipliers** – For each risk factor the model uses published hazard ratios (HR):
   - Smoking: current smokers HR = 2.8; quitting reduces risk linearly to 1.0 after 20 years.
   - Physical activity: hazard decreases to 0.53 at ≥60 MET‑hours/week.
   - Body mass index: BMI 30 has HR ≈1.45 relative to reference BMI 22.5–<25.
   - Alcohol: two drinks/day corresponds to HR ≈1.06 with a monotonic dose curve.
   These HRs multiply to form a combined proportional hazard for all-cause mortality.
3. **Adjusted mortality** – The baseline hazard `µ_base` is scaled by the product of HRs to obtain an adjusted hazard: `µ_adj = µ_base × HR_total`. The adjusted annual probability becomes `qx_adj = 1 - exp(-µ_adj)`.
4. **Life table integration** – The model constructs life tables from both baseline and adjusted `qx` to compute survival (`S_x`) and remaining life expectancy (`e_x`).
5. **Healthy life expectancy (optional)** – If quality adjustment is toggled, person‑years are weighted by age‑specific “healthy” proportions using the Sullivan method.
6. **Screening benefits** – Preventive screenings (colorectal and breast) add fixed life‑years and QALYs per participant from modeling studies.

## Sample calculation
Consider a 35‑year‑old female who currently smokes, performs no structured exercise, has BMI 30, and drinks two alcoholic beverages per day. No screenings are assumed.

1. Baseline hazard at age 35: `qx = 0.00102` → `µ_base ≈ 0.00102`.
2. Hazard ratios:
   - Smoking HR = 2.8.
   - Physical activity HR = 1.00 (inactivity is reference).
   - BMI HR = 1.45.
   - Alcohol HR ≈ 1.06 for 2 drinks/day.
   Combined `HR_total = 2.8 × 1.00 × 1.45 × 1.06 ≈ 4.30`.
3. Adjusted hazard at age 35: `µ_adj = 0.00102 × 4.30 ≈ 0.00439` → `qx_adj = 1 − exp(-0.00439) ≈ 0.00438` (0.44% annual mortality).
4. Repeating this transformation for all ages yields adjusted survival curves. Running the model gives:
   - Baseline remaining life expectancy `LE_base = 72.23` years (total lifespan ≈107.2).
   - Adjusted remaining life expectancy `LE_adj = 62.38` years.
   - **Delta:** `LE_adj − LE_base = −9.85` years.
   Contribution breakdown: smoking −5.79 y, BMI −1.56 y, alcohol −0.21 y.

Thus in this scenario, the combined behavioral factors shorten expected lifespan by almost ten years compared to baseline population averages.

## Running locally
Simply open `index.html` in a modern browser. All assets and datasets are embedded so no server is required.

## Sample usage
1. Enter age, sex, and behavior inputs.
2. Click **Recalculate** to view life expectancy and healthy life expectancy results.
3. Use the download button to export survival curves to CSV.

## Disclaimer
The model uses population-level associations and period life tables. It does not provide medical advice and does not account for individual medical histories.
