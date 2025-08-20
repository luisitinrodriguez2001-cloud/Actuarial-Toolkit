// Methodology descriptions for various variables

export const methodologyInfo = {
  smoking: `
    <h3>Smoking</h3>
    <p><strong>Source:</strong> <a href="https://www.nejm.org/doi/full/10.1056/NEJMsa1211128" target="_blank" rel="noopener">Jha et al., 2013</a></p>
    <p><strong>Implementation:</strong> js/hrModels.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Current smokers face about twice the mortality risk; quitting gradually lowers risk toward never-smoker levels.</p>
    <p><strong>Mitigation:</strong> Quit smoking and avoid secondhand exposure.</p>
    <p><strong>Population:</strong> Roughly 12% of U.S. adults smoke.</p>
  `,
  physical_activity: `
    <h3>Physical Activity</h3>
    <p><strong>Source:</strong> <a href="https://doi.org/10.1093/aje/kwv148" target="_blank" rel="noopener">Arem et al., 2015</a></p>
    <p><strong>Implementation:</strong> js/hrModels.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Greater MET-hours per week are associated with up to ~30% lower mortality.</p>
    <p><strong>Mitigation:</strong> Engage in regular moderate or vigorous exercise.</p>
    <p><strong>Population:</strong> About 24% of U.S. adults meet activity guidelines.</p>
  `,
  bmi: `
    <h3>BMI</h3>
    <p><strong>Source:</strong> <a href="https://www.nejm.org/doi/full/10.1056/NEJMoa1606148" target="_blank" rel="noopener">Global BMI Mortality Collaboration, 2016</a></p>
    <p><strong>Implementation:</strong> js/hrModels.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Both underweight and obesity raise mortality compared with BMI 22.5–&lt;25.</p>
    <p><strong>Mitigation:</strong> Maintain a healthy weight through balanced diet and activity.</p>
    <p><strong>Population:</strong> Roughly 42% of adults have obesity.</p>
  `,
  alcohol: `
    <h3>Alcohol</h3>
    <p><strong>Source:</strong> <a href="https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(18)30134-X/fulltext" target="_blank" rel="noopener">Wood et al., 2018</a></p>
    <p><strong>Implementation:</strong> js/hrModels.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Mortality risk increases with daily drinks; no protective effect assumed.</p>
    <p><strong>Mitigation:</strong> Limit intake or abstain.</p>
    <p><strong>Population:</strong> Around 17% of adults report binge drinking.</p>
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
    <p><strong>Source:</strong> <a href="https://www.uspreventiveservicestaskforce.org/uspstf/document/evidence-report-colorectal-cancer-screening" target="_blank" rel="noopener">USPSTF 2021 Evidence Review</a></p>
    <p><strong>Implementation:</strong> js/screening.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Modeled as life-years gained from screening participation.</p>
    <p><strong>Mitigation:</strong> Follow USPSTF screening guidelines.</p>
    <p><strong>Population:</strong> About 69% of adults 50–75 are up to date.</p>
  `,
  breast_screening: `
    <h3>Breast Screening</h3>
    <p><strong>Source:</strong> <a href="https://www.uspreventiveservicestaskforce.org/uspstf/document/evidence-report/breast-cancer-screening-2016" target="_blank" rel="noopener">USPSTF 2016 Evidence Review</a></p>
    <p><strong>Implementation:</strong> js/screening.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Modeled as life-years gained from routine mammography.</p>
    <p><strong>Mitigation:</strong> Participate in recommended screening intervals.</p>
    <p><strong>Population:</strong> Roughly 75% of women 50–74 had a recent mammogram.</p>
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

