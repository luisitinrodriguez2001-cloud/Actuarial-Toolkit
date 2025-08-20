// Methodology descriptions for various variables

export const methodologyInfo = {
  smoking: `
    <h3>Smoking</h3>
    <p><strong>Source:</strong> Jha et al., 2013</p>
    <p><strong>Implementation:</strong> js/hrModels.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Current smokers have about 2.8× the mortality of never smokers; quitting for ∼20 years returns risk to baseline.</p>
    <p><strong>Mitigation:</strong> Quit smoking and avoid secondhand exposure.</p>
    <p><strong>Population:</strong> About 9.9% of U.S. adults smoke (CDC).</p>
  `,
  physical_activity: `
    <h3>Physical Activity</h3>
    <p><strong>Source:</strong> Arem et al., 2015</p>
    <p><strong>Implementation:</strong> js/hrModels.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> ≥60 MET‑h/week corresponds to HR≈0.53 (47% lower mortality) versus inactivity.</p>
    <p><strong>Mitigation:</strong> Engage in regular moderate or vigorous exercise.</p>
    <p><strong>Population:</strong> Only 24.2% meet both aerobic and strength guidelines (CDC).</p>
  `,
  bmi: `
    <h3>BMI</h3>
    <p><strong>Source:</strong> Global BMI Mortality Collaboration, 2016</p>
    <p><strong>Implementation:</strong> js/hrModels.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> BMI 35–39.9 carries HR≈1.94; BMI≥40 reaches HR≈2.76; underweight HR≈1.22 vs BMI 22.5–&lt;25.</p>
    <p><strong>Mitigation:</strong> Maintain a healthy weight through balanced diet and activity.</p>
    <p><strong>Population:</strong> About 40.3% of adults have obesity (CDC).</p>
  `,
  alcohol: `
    <h3>Alcohol</h3>
    <p><strong>Source:</strong> Wood et al., 2018</p>
    <p><strong>Implementation:</strong> js/hrModels.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Mortality risk rises to HR≈1.40 at six drinks/day; no protective effect assumed.</p>
    <p><strong>Mitigation:</strong> Limit intake or abstain.</p>
    <p><strong>Population:</strong> About 25.1% report at least one heavy drinking day in the past year (CDC).</p>
  `,
  diet: `
    <h3>Diet</h3>
    <p><strong>Source:</strong> Not yet modeled.</p>
    <p><strong>Implementation:</strong> pending</p>
    <p><strong>Hazard-Ratio Effect:</strong> Diet quality influences cardiovascular and overall mortality.</p>
    <p><strong>Mitigation:</strong> Emphasize fruits, vegetables, whole grains, and minimal processed foods.</p>
    <p><strong>Population:</strong> Only about 10% meet fruit and vegetable recommendations.</p>
  `,
  blood_pressure_cholesterol: `
    <h3>Blood Pressure / Cholesterol</h3>
    <p><strong>Source:</strong> Not yet modeled.</p>
    <p><strong>Implementation:</strong> pending</p>
    <p><strong>Hazard-Ratio Effect:</strong> Hypertension and high LDL elevate cardiovascular mortality.</p>
    <p><strong>Mitigation:</strong> Control levels with medication and lifestyle.</p>
    <p><strong>Population:</strong> Nearly half of U.S. adults have hypertension.</p>
  `,
  diabetes: `
    <h3>Diabetes</h3>
    <p><strong>Source:</strong> Not yet modeled.</p>
    <p><strong>Implementation:</strong> pending</p>
    <p><strong>Hazard-Ratio Effect:</strong> Diabetes roughly doubles mortality risk.</p>
    <p><strong>Mitigation:</strong> Maintain glycemic control via diet, exercise, and medication.</p>
    <p><strong>Population:</strong> About 11% of U.S. adults have diabetes.</p>
  `,
  sleep: `
    <h3>Sleep</h3>
    <p><strong>Source:</strong> Not yet modeled.</p>
    <p><strong>Implementation:</strong> pending</p>
    <p><strong>Hazard-Ratio Effect:</strong> Very short or long sleep durations are linked to higher mortality.</p>
    <p><strong>Mitigation:</strong> Aim for 7–9 hours of quality sleep nightly.</p>
    <p><strong>Population:</strong> About 35% of adults sleep less than 7 hours.</p>
  `,
  socioeconomic_status: `
    <h3>Socioeconomic Status</h3>
    <p><strong>Source:</strong> Not yet modeled.</p>
    <p><strong>Implementation:</strong> pending</p>
    <p><strong>Hazard-Ratio Effect:</strong> Lower SES is associated with higher mortality risk.</p>
    <p><strong>Mitigation:</strong> Social support and policy interventions may reduce risk.</p>
    <p><strong>Population:</strong> Roughly 11% of Americans live in poverty.</p>
  `,
  colorectal_screening: `
    <h3>Colorectal Screening</h3>
    <p><strong>Source:</strong> Knudsen et al., 2021</p>
    <p><strong>Implementation:</strong> js/screening.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Modeled as life-years gained from screening participation.</p>
    <p><strong>Mitigation:</strong> Follow USPSTF screening guidelines.</p>
  `,
  breast_screening: `
    <h3>Breast Screening</h3>
    <p><strong>Source:</strong> USPSTF, 2016</p>
    <p><strong>Implementation:</strong> js/screening.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Modeled as life-years gained from routine mammography.</p>
    <p><strong>Mitigation:</strong> Participate in recommended screening intervals.</p>
    <p><strong>Population:</strong> 69.1% of women ≥40 had a mammogram within 2 years (CDC).</p>
  `
};

export function loadMethodology() {
  const select = document.getElementById('methodology-select');
  const content = document.getElementById('methodology-content');
  if (!select || !content) return;
  select.addEventListener('change', (e) => {
    const key = e.target.value;
    content.innerHTML = methodologyInfo[key] || '';
  });
}

