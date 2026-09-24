import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file automatically for local development if present
try {
  process.loadEnvFile();
} catch (err) {
  // .env file not present or running in cloud environment (e.g. Vercel)
}

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Quiz Question Generation Endpoint
app.post('/api/generate-question', async (req, res) => {
  const {
    topicName = 'General Academics',
    scope = 'General knowledge and foundational principles',
    difficultyBounds = 'Introductory undergraduate level',
    tier = 1,
    upgradeName = 'Study Upgrade',
    previousQuestions = []
  } = req.body || {};

  const tierDescriptions = {
    1: 'Tier 1 (Foundational Knowledge): Core definitions, baseline terminology, and fundamental principles strictly within the specified scope.',
    2: 'Tier 2 (Intermediate Application): Applying concepts, interpreting examples, and solving standard problems strictly within the specified scope.',
    3: 'Tier 3 (Advanced Synthesis): Analyzing scenarios, comparing relationships, and evaluating edge cases strictly within the specified scope.'
  };

  const tierLabel = tierDescriptions[tier] || tierDescriptions[1];

  // Formulate previous question avoidance list
  const avoidList = Array.isArray(previousQuestions) && previousQuestions.length > 0
    ? `\nPREVIOUSLY ASKED QUESTIONS IN THIS SESSION (DO NOT REPEAT THESE QUESTIONS OR THEIR DIRECT FOCUS):\n${previousQuestions.slice(-10).map((q, idx) => `  ${idx + 1}. "${q}"`).join('\n')}\n`
    : '';

  // Attempt Gemini API if GEMINI_API_KEY is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
    const prompt = `You are a distinguished university professor creating an exam checkpoint question for a student.

STUDY SESSION GUIDELINES (DEFINED BY THE STUDENT):
- Subject / Course: ${topicName}
- Scope & Content Boundaries: ${scope}
- Difficulty Level & Bounds: ${difficultyBounds}
- Progression Tier: ${tierLabel}
- Checkpoint Item: "${upgradeName}"
${avoidList}
CRITICAL REQUIREMENTS - STRICT SCOPE & DIFFICULTY ADHERENCE:
1. USER GUIDELINES ARE THE ABSOLUTE PRIORITY:
   - Your question MUST be strictly and entirely within the "Scope & Content Boundaries" (${scope}) and "Difficulty Level & Bounds" (${difficultyBounds}) specified above.
   - Respect all inclusions, limits, and exclusions specified by the student without exception (e.g. if the scope specifies certain chapters or says "do NOT include X" or "only Y", you must strictly follow those boundaries).
   - NEVER introduce concepts, mechanisms, or advanced terminology that lie outside the student's defined scope or beyond the specified difficulty level.

2. AVOID REPETITION WHILE REMAINING IN SCOPE:
   - Do not repeat or closely rephrase any of the previously asked questions listed above.
   - Explore different concepts, definitions, rules, examples, or applications, but ALWAYS stay 100% inside the student's defined scope.

3. QUESTION FORMAT:
   - Exactly ONE multiple-choice question.
   - 4 plausible options (Option A, B, C, D) of roughly comparable length.
   - Exactly one objectively correct answer based on academic consensus within the defined scope.
   - A concise 1-2 sentence explanation clarifying why the correct answer is right according to the course scope.

4. RESPONSE FORMAT:
   Return ONLY a valid JSON object matching this schema (no markdown, no backticks, no code fences, no extra text):
{
  "question": "Question text here",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctIndex": 0,
  "explanation": "Clear 1-2 sentence explanation of why the correct option is right."
}`;

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.6,
                topP: 0.9
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            let cleaned = text.trim();
            if (cleaned.startsWith('```json')) {
              cleaned = cleaned.replace(/^```json/i, '').replace(/```$/, '').trim();
            } else if (cleaned.startsWith('```')) {
              cleaned = cleaned.replace(/^```/i, '').replace(/```$/, '').trim();
            }
            const parsed = JSON.parse(cleaned);
            if (parsed.question && Array.isArray(parsed.options) && parsed.options.length >= 2 && typeof parsed.correctIndex === 'number') {
              // Shuffle options so correct answer isn't predictably indexed
              const randomized = shuffleQuestion(parsed);
              return res.json({ ...randomized, source: `gemini (${model})` });
            }
          }
        } else {
          const errStatus = response.status;
          const errText = await response.text();
          console.warn(`Gemini API model ${model} returned status ${errStatus}:`, errText.slice(0, 160));
        }
      } catch (err) {
        console.warn(`Gemini API attempt with ${model} failed:`, err.message);
      }
    }
  }

  // Fallback procedural / domain-aware generator with rich question pools
  const fallbackQuestions = generateFallbackQuestion(topicName, scope, difficultyBounds, tier, previousQuestions);
  res.json({ ...fallbackQuestions, source: 'offline-procedural' });
});

// Fallback procedural question generator with diverse pools
function generateFallbackQuestion(topicName, scope, difficultyBounds, tier, previousQuestions = []) {
  const cleanTopic = topicName.toLowerCase();
  let pool = [];

  // Curated templates for popular subjects
  if (cleanTopic.includes('chem') || cleanTopic.includes('organic')) {
    if (tier === 1) {
      pool = [
        {
          question: `In ${topicName} (${scope.slice(0, 40)}...), which type of hybridization corresponds to a planar geometry with 120° bond angles?`,
          options: ['sp³', 'sp²', 'sp', 'dsp³'],
          correctIndex: 1,
          explanation: 'sp² hybridization results in trigonal planar geometry with characteristic 120° bond angles.'
        },
        {
          question: `In organic chemistry, which functional group consists of a carbonyl bonded directly to at least one hydrogen atom?`,
          options: ['Ketone', 'Aldehyde', 'Carboxylic acid', 'Ester'],
          correctIndex: 1,
          explanation: 'Aldehydes possess a carbonyl carbon bonded to at least one hydrogen atom (R-CHO).'
        },
        {
          question: `Regarding bond polarity within ${scope.slice(0, 35)}..., why is the carbonyl carbon (C=O) strongly electrophilic?`,
          options: ['Carbon is more electronegative than oxygen, drawing electron density', 'The significant electronegativity difference between oxygen and carbon creates a partial positive charge on carbon', 'The pi bond has greater electron density localized on the carbon atom', 'Steric hindrance repels incoming electron pairs from the oxygen atom'],
          correctIndex: 1,
          explanation: 'Oxygen is substantially more electronegative than carbon, polarizing the pi-system and leaving the carbon with a marked partial positive charge.'
        },
        {
          question: `Which resonance contributor correctly describes the dipolar character of a carbonyl group?`,
          options: ['Positive charge on oxygen, negative charge on carbon', 'Negative charge on oxygen, positive charge on carbon with a single C-O bond', 'Radical single bond with two unpaired electrons', 'Equally shared covalent triple bond character'],
          correctIndex: 1,
          explanation: 'The major dipolar resonance structure places a negative formal charge on oxygen and a positive formal charge on carbon.'
        }
      ];
    } else if (tier === 2) {
      pool = [
        {
          question: `Considering the scope of ${scope.slice(0, 45)}..., which factor most strongly stabilizes a carbocation intermediate in nucleophilic substitution?`,
          options: ['Electron-withdrawing inductive effects', 'Hyperconjugation and resonance delocalization', 'Steric hindrance from nonpolar solvents', 'Anti-periplanar stereoelectronic strain'],
          correctIndex: 1,
          explanation: 'Alkyl group hyperconjugation and adjacent pi-system resonance delocalize the positive charge, stabilizing the carbocation.'
        },
        {
          question: `When a Grignard reagent (R-MgBr) nucleophilically attacks an aldehyde, what is the resulting product after acidic workup?`,
          options: ['Primary alcohol', 'Secondary alcohol', 'Tertiary alcohol', 'Carboxylic acid'],
          correctIndex: 1,
          explanation: 'Addition of a Grignard reagent to an aldehyde yields a secondary alcohol (except with formaldehyde, which produces a primary alcohol).'
        },
        {
          question: `In carbonyl chemistry (${scope.slice(0, 40)}...), what intermediate forms during the acid-catalyzed hydration of an aldehyde or ketone?`,
          options: ['Oxonium ion intermediate followed by neutral geminal diol', 'Carbanion enolate intermediate', 'Free radical alkyl peroxide', 'Cyclic epoxide intermediate'],
          correctIndex: 0,
          explanation: 'Protonation of the carbonyl oxygen creates a resonance-stabilized oxonium ion, greatly enhancing its electrophilicity toward water attack to form a gem-diol.'
        },
        {
          question: `How does nucleophilic addition to an aldehyde compare in rate to addition to a ketone under identical conditions?`,
          options: ['Ketones react faster because their alkyl groups increase electrophilicity', 'Aldehydes react faster due to less steric hindrance and greater electronic polarization', 'Both react at exactly identical rates due to the same C=O bond dissociation energy', 'Ketones react faster because of alpha-hydrogen stabilization'],
          correctIndex: 1,
          explanation: 'Aldehydes have only one alkyl group, reducing steric hindrance at the carbonyl carbon and offering less electron donation than the two alkyl groups of a ketone.'
        }
      ];
    } else {
      pool = [
        {
          question: `For advanced ${topicName}, what controls the regioselectivity in the addition of electrophiles to conjugated dienes at low temperatures (kinetic control)?`,
          options: ['Relative thermodynamic stability of the 1,4-adduct', '1,2-addition via proximate ion pair collapse with lower activation energy', 'Entropy of activation dominating over enthalpy', 'Reversible equilibration toward the more substituted alkene'],
          correctIndex: 1,
          explanation: 'At low temperatures, the 1,2-adduct forms faster due to proximity of the leaving counter-ion, representing the kinetic product.'
        },
        {
          question: `In advanced carbonyl synthesis (${scope.slice(0, 40)}...), what role does ethylene glycol with catalytic acid play for ketones?`,
          options: ['Irreversible oxidation to a dicarboxylic acid', 'Formation of a cyclic acetal protecting group stable to basic and nucleophilic conditions', 'Direct reductive amination to an amine', 'Alpha-halogenation via enol stabilization'],
          correctIndex: 1,
          explanation: 'Ethylene glycol forms a 1,3-dioxolane (cyclic acetal) protecting group that withstands strong nucleophiles (like Grignards or hydrides) and can be removed by aqueous acid.'
        },
        {
          question: `During the Wittig reaction of a ketone with a phosphorus ylide (Wittig reagent), what four-membered cyclic intermediate is formed?`,
          options: ['Lactam ring', 'Oxaphosphetane intermediate', 'Beta-lactone ring', 'Dioxetane heterocycle'],
          correctIndex: 1,
          explanation: 'The [2+2] cycloaddition of the ylide with the carbonyl yields an oxaphosphetane intermediate, which collapses driving the formation of a strong P=O bond and an alkene.'
        }
      ];
    }
  } else if (cleanTopic.includes('bio') || cleanTopic.includes('cell') || cleanTopic.includes('neuro')) {
    if (tier === 1) {
      pool = [
        {
          question: `Within ${topicName}, what is the primary structural component of biological cell membranes?`,
          options: ['Phospholipid bilayer with embedded proteins', 'Cellulose and polysaccharide mesh', 'Rigid polypeptide crosslinks', 'Triglyceride crystalline lattice'],
          correctIndex: 0,
          explanation: 'Phospholipids form amphipathic bilayers that provide fluid, semi-permeable boundaries for cellular compartments.'
        },
        {
          question: `Which organelle is primarily responsible for post-translational modification, sorting, and packaging of secretory proteins?`,
          options: ['Mitochondria', 'Golgi apparatus', 'Peroxisome', 'Smooth endoplasmic reticulum'],
          correctIndex: 1,
          explanation: 'The Golgi apparatus modifies, sorts, and packages proteins synthesized in the rough ER for delivery to lysosomes, the plasma membrane, or secretion.'
        },
        {
          question: `What fundamental process converts DNA genetic sequence information into an RNA transcript?`,
          options: ['Translation', 'Transcription', 'Replication', 'Translocation'],
          correctIndex: 1,
          explanation: 'Transcription is the synthesis of complementary RNA molecules directed by DNA-dependent RNA polymerases.'
        }
      ];
    } else if (tier === 2) {
      pool = [
        {
          question: `Covering ${scope.slice(0, 45)}..., what effect does a competitive enzyme inhibitor have on Km and Vmax in Michaelis-Menten kinetics?`,
          options: ['Decreases Vmax, leaves Km unchanged', 'Increases apparent Km, leaves Vmax unchanged', 'Decreases both Km and Vmax equally', 'Increases Vmax without altering Km'],
          correctIndex: 1,
          explanation: 'A competitive inhibitor competes with substrate for the active site, increasing apparent Km while Vmax remains achievable at high substrate concentrations.'
        },
        {
          question: `During neuronal action potential propagation, what drives the rapid depolarizing upstroke?`,
          options: ['Inward flux of Na⁺ through voltage-gated sodium channels', 'Outward flux of K⁺ through delayed rectifier channels', 'Inward pumping of Cl⁻ via primary active transport', 'Efflux of Ca²⁺ from the sarcoplasmic reticulum'],
          correctIndex: 0,
          explanation: 'Depolarization above threshold triggers rapid opening of voltage-gated Na⁺ channels, allowing a surge of Na⁺ influx along its electrochemical gradient.'
        }
      ];
    } else {
      pool = [
        {
          question: `In advanced ${topicName}, how does allosteric feedback inhibition typically modulate metabolic pathway flux?`,
          options: ['End-products bind the active site irreversibly', 'End-products bind regulatory non-active sites to induce conformational shifts in committed-step enzymes', 'Direct transcriptional silencing of ribosome biogenesis', 'Ubiquitination and proteasomal degradation of all intermediate enzymes'],
          correctIndex: 1,
          explanation: 'Feedback inhibitors bind distinct allosteric regulatory sites on rate-limiting enzymes to shift quaternary conformation away from the active R-state.'
        },
        {
          question: `How does ubiquitin-mediated proteolysis selectively target cellular proteins for degradation?`,
          options: ['Phosphorylation by protein kinase A targeting to lysosomes', 'Polyubiquitination by E1, E2, and E3 ligases targeting to the 26S proteasome', 'Direct cleaving by caspase-3 in the extracellular matrix', 'Ribosomal arrest inducing immediate peptide hydrolysis'],
          correctIndex: 1,
          explanation: 'The sequential action of E1 (activating), E2 (conjugating), and E3 (substrate-specific ligase) attaches polyubiquitin chains that direct the substrate to the 26S proteasome.'
        }
      ];
    }
  } else if (cleanTopic.includes('calc') || cleanTopic.includes('math') || cleanTopic.includes('physics')) {
    if (tier === 1) {
      pool = [
        {
          question: `In ${topicName}, what does the derivative of a single-variable position function x(t) with respect to time represent?`,
          options: ['Total distance traveled', 'Instantaneous velocity v(t)', 'Instantaneous acceleration a(t)', 'Total mechanical work done'],
          correctIndex: 1,
          explanation: 'The first derivative of position with respect to time dx/dt represents instantaneous velocity.'
        },
        {
          question: `By the Fundamental Theorem of Calculus, what does the definite integral of a continuous function f(x) from a to b represent?`,
          options: ['The slope of the tangent line at (a + b)/2', 'The net signed area between the graph of f(x) and the x-axis from a to b', 'The second derivative of f(x) evaluated at the midpoint', 'The curvature of the function space'],
          correctIndex: 1,
          explanation: 'The definite integral computes the accumulated net signed area between the curve and the horizontal axis over [a, b].'
        }
      ];
    } else if (tier === 2) {
      pool = [
        {
          question: `Regarding ${scope.slice(0, 45)}..., what condition must be satisfied for a vector field F to be conservative?`,
          options: ['The divergence ∇ · F must be strictly positive everywhere', 'The line integral of F around any closed path must equal zero (curl ∇ × F = 0)', 'The field must have non-zero flux across every closed surface', 'The scalar potential must be discontinuous along the boundary'],
          correctIndex: 1,
          explanation: 'A conservative vector field is path-independent, meaning the circulation around any closed loop is zero and curl F = 0.'
        },
        {
          question: `What method is systematically used to evaluate the integral of the product of two functions, derived from the product rule of differentiation?`,
          options: ['Partial fraction decomposition', 'Integration by parts (∫u dv = uv - ∫v du)', 'Trigonometric substitution with Secant', 'L\'Hôpital\'s limit rule'],
          correctIndex: 1,
          explanation: 'Integration by parts decomposes ∫u dv into uv - ∫v du, directly transforming the integral of products.'
        }
      ];
    } else {
      pool = [
        {
          question: `In advanced ${topicName}, what does Green\'s Theorem / Stokes\' Theorem relate?`,
          options: ['The flux through a volume to the curvature of space', 'The line integral of a vector field around a boundary curve to the surface integral of its curl', 'The Fourier series coefficients to the Laplace transform poles', 'The eigenvalues of a Hessian matrix to global extrema bounds'],
          correctIndex: 1,
          explanation: 'Stokes\' Theorem connects the line integral of a vector field along a closed boundary curve to the surface integral of the field\'s curl over the enclosed surface.'
        }
      ];
    }
  }

  // General customizable academic fallbacks if not matched or pool empty
  if (pool.length === 0) {
    if (tier === 1) {
      pool = [
        {
          question: `Regarding "${topicName}" (${scope.slice(0, 35)}...): Which statement best captures a primary foundational definition in this subject?`,
          options: [
            `Foundational principles establish standard models, baseline definitions, and core terminology in ${topicName}`,
            `Core definitions in this field are entirely arbitrary with no observational basis`,
            `Introductory concepts contradict all advanced experimental data`,
            `Empirical observations cannot be systematized in this discipline`
          ],
          correctIndex: 0,
          explanation: `Mastering foundational concepts in ${topicName} establishes the necessary vocabulary and framework for subsequent problem solving.`
        },
        {
          question: `When establishing initial premises in "${topicName}": Why is establishing explicit boundary conditions and scope critical?`,
          options: [
            `It isolates variables and defines where theoretical assumptions remain valid`,
            `Boundary conditions are irrelevant in modern scientific methodology`,
            `It guarantees that all models apply equally under extreme relativistic conditions`,
            `It prevents the use of empirical measurements`
          ],
          correctIndex: 0,
          explanation: 'Defining boundary conditions ensures mathematical and conceptual models are evaluated strictly where their assumptions hold.'
        }
      ];
    } else if (tier === 2) {
      pool = [
        {
          question: `In the context of "${topicName}" (${scope.slice(0, 40)}...): How does intermediate analytical problem-solving systematically proceed?`,
          options: [
            `Decomposing complex interactions, isolating active parameters, and applying relevant mechanisms`,
            `Relying purely on intuitive guesswork without dimensional analysis or consistency checks`,
            `Assuming all components operate under static equilibrium at all times`,
            `Ignoring boundary constraints specified in the scenario`
          ],
          correctIndex: 0,
          explanation: `Systematic problem-solving in ${topicName} relies on decomposing parameters and rigorously testing governing mechanisms.`
        },
        {
          question: `Considering predictive models in "${topicName}": What is the consequence of altering a governing rate-limiting parameter?`,
          options: [
            `The rate-limiting step sets the maximum throughput and dictates the overall system response`,
            `Rate-limiting parameters have zero impact on system kinetics or equilibrium`,
            `All downstream processes accelerate exponentially regardless of input flux`,
            `Feedback loops immediately dismantle the governing framework`
          ],
          correctIndex: 0,
          explanation: 'The committed or rate-limiting step governs overall pathway kinetics and sensitivity to perturbations.'
        }
      ];
    } else {
      pool = [
        {
          question: `Synthesizing concepts in "${topicName}" (${scope.slice(0, 45)}...): What distinguishes advanced mastery in this topic?`,
          options: [
            `Evaluating multi-variable trade-offs, reconciling competing mechanisms, and predicting edge-case behaviors`,
            `Memorizing raw facts without comprehending underlying causality`,
            `Applying simplified introductory approximations to non-ideal systems without correction`,
            `Dismissing quantitative rigor in favor of purely qualitative descriptions`
          ],
          correctIndex: 0,
          explanation: `Advanced mastery requires synthesizing multiple concepts, evaluating trade-offs, and understanding where standard models break down.`
        }
      ];
    }
  }

  // Filter out questions that were previously asked recently
  const unasked = pool.filter(q => !previousQuestions.some(prev => prev && prev.toLowerCase().includes(q.question.slice(0, 30).toLowerCase())));
  const candidatePool = unasked.length > 0 ? unasked : pool;
  const selected = candidatePool[Math.floor(Math.random() * candidatePool.length)];
  return shuffleQuestion(selected);
}

function shuffleQuestion(q) {
  const correctOpt = q.options[q.correctIndex];
  const options = [...q.options];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return {
    ...q,
    options,
    correctIndex: options.indexOf(correctOpt)
  };
}

// Fallback route to serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Only listen locally; Vercel handles the serverless execution
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running locally at http://localhost:${PORT}`);
  });
}

export default app;

