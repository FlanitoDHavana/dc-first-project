import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    upgradeName = 'Study Upgrade'
  } = req.body || {};

  const tierDescriptions = {
    1: 'Tier 1 (Foundational Knowledge): Focus on core definitions, basic principles, and terminology.',
    2: 'Tier 2 (Intermediate Application): Focus on mechanisms, problem-solving, and applying concepts.',
    3: 'Tier 3 (Advanced Synthesis): Focus on complex problem-solving, edge cases, and in-depth analysis.'
  };

  const tierLabel = tierDescriptions[tier] || tierDescriptions[1];

  // Attempt Gemini API if GEMINI_API_KEY is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const prompt = `You are a professor at Johns Hopkins University crafting a quiz question for a student cramming for an exam.
Topic: ${topicName}
Scope & Content Bounds: ${scope}
Difficulty Constraints: ${difficultyBounds}
Target Tier: ${tierLabel}
Study Milestone: Unlocking "${upgradeName}"

Generate exactly ONE multiple-choice question that strictly respects the scope and difficulty bounds provided.
Return ONLY a raw JSON object (no markdown, no backticks, no extra text) with this exact schema:
{
  "question": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Brief 1-2 sentence explanation of why the correct option is right."
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.question && Array.isArray(parsed.options) && typeof parsed.correctIndex === 'number') {
            return res.json({ ...parsed, source: 'gemini' });
          }
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to procedural question generator:', err.message);
    }
  }

  // Fallback procedural / domain-aware generator
  const fallbackQuestions = generateFallbackQuestion(topicName, scope, difficultyBounds, tier);
  res.json({ ...fallbackQuestions, source: 'offline-procedural' });
});

// Fallback procedural question generator
function generateFallbackQuestion(topicName, scope, difficultyBounds, tier) {
  const cleanTopic = topicName.toLowerCase();

  // Curated templates for popular subjects
  if (cleanTopic.includes('chem') || cleanTopic.includes('organic')) {
    if (tier === 1) {
      return {
        question: `In ${topicName} (${scope.slice(0, 40)}...), which type of hybridization corresponds to a planar geometry with 120° bond angles?`,
        options: ['sp³', 'sp²', 'sp', 'dsp³'],
        correctIndex: 1,
        explanation: 'sp² hybridization results in trigonal planar geometry with characteristic 120° bond angles.'
      };
    } else if (tier === 2) {
      return {
        question: `Considering the scope of ${scope.slice(0, 45)}..., which factor most strongly stabilizes a carbocation intermediate in nucleophilic substitution?`,
        options: ['Electron-withdrawing inductive effects', 'Hyperconjugation and resonance delocalization', 'Steric hindrance from nonpolar solvents', 'Anti-periplanar stereoelectronic strain'],
        correctIndex: 1,
        explanation: 'Alkyl group hyperconjugation and adjacent pi-system resonance delocalize the positive charge, stabilizing the carbocation.'
      };
    } else {
      return {
        question: `For advanced ${topicName}, what controls the regioselectivity in the addition of electrophiles to conjugated dienes at low temperatures (kinetic control)?`,
        options: ['Relative thermodynamic stability of the 1,4-adduct', '1,2-addition via proximate ion pair collapse with lower activation energy', 'Entropy of activation dominating over enthalpy', 'Reversible equilibration toward the more substituted alkene'],
        correctIndex: 1,
        explanation: 'At low temperatures, the 1,2-adduct forms faster due to proximity of the leaving counter-ion, representing the kinetic product.'
      };
    }
  }

  if (cleanTopic.includes('bio') || cleanTopic.includes('cell') || cleanTopic.includes('neuro')) {
    if (tier === 1) {
      return {
        question: `Within ${topicName}, what is the primary structural component of biological cell membranes?`,
        options: ['Phospholipid bilayer with embedded proteins', 'Cellulose and polysaccharide mesh', 'Rigid polypeptide crosslinks', 'Triglyceride crystalline lattice'],
        correctIndex: 0,
        explanation: 'Phospholipids form amphipathic bilayers that provide fluid, semi-permeable boundaries for cellular compartments.'
      };
    } else if (tier === 2) {
      return {
        question: `Covering ${scope.slice(0, 45)}..., what effect does a competitive enzyme inhibitor have on Km and Vmax in Michaelis-Menten kinetics?`,
        options: ['Decreases Vmax, leaves Km unchanged', 'Increases apparent Km, leaves Vmax unchanged', 'Decreases both Km and Vmax equally', 'Increases Vmax without altering Km'],
        correctIndex: 1,
        explanation: 'A competitive inhibitor competes with substrate for the active site, increasing apparent Km while Vmax remains achievable at high substrate concentrations.'
      };
    } else {
      return {
        question: `In advanced ${topicName}, how does allosteric feedback inhibition typically modulate metabolic pathway flux?`,
        options: ['End-products bind the active site irreversibly', 'End-products bind regulatory non-active sites to induce conformational shifts in committed-step enzymes', 'Direct transcriptional silencing of ribosome biogenesis', 'Ubiquitination and proteasomal degradation of all intermediate enzymes'],
        correctIndex: 1,
        explanation: 'Feedback inhibitors bind distinct allosteric regulatory sites on rate-limiting enzymes to shift quaternary conformation away from the active R-state.'
      };
    }
  }

  if (cleanTopic.includes('calc') || cleanTopic.includes('math') || cleanTopic.includes('physics')) {
    if (tier === 1) {
      return {
        question: `In ${topicName}, what does the derivative of a single-variable position function x(t) with respect to time represent?`,
        options: ['Total distance traveled', 'Instantaneous velocity v(t)', 'Instantaneous acceleration a(t)', 'Total mechanical work done'],
        correctIndex: 1,
        explanation: 'The first derivative of position with respect to time dx/dt represents instantaneous velocity.'
      };
    } else if (tier === 2) {
      return {
        question: `Regarding ${scope.slice(0, 45)}..., what condition must be satisfied for a vector field F to be conservative?`,
        options: ['The divergence ∇ · F must be strictly positive everywhere', 'The line integral of F around any closed path must equal zero (curl ∇ × F = 0)', 'The field must have non-zero flux across every closed surface', 'The scalar potential must be discontinuous along the boundary'],
        correctIndex: 1,
        explanation: 'A conservative vector field is path-independent, meaning the circulation around any closed loop is zero and curl F = 0.'
      };
    } else {
      return {
        question: `In advanced ${topicName}, what does Green\'s Theorem / Stokes\' Theorem relate?`,
        options: ['The flux through a volume to the curvature of space', 'The line integral of a vector field around a boundary curve to the surface integral of its curl', 'The Fourier series coefficients to the Laplace transform poles', 'The eigenvalues of a Hessian matrix to global extrema bounds'],
        correctIndex: 1,
        explanation: 'Stokes\' Theorem connects the line integral of a vector field along a closed boundary curve to the surface integral of the field\'s curl over the enclosed surface.'
      };
    }
  }

  // General customizable academic fallback
  const tierQuestions = {
    1: {
      question: `Regarding your study of "${topicName}" (${scope.slice(0, 40)}...): Which statement best reflects a foundational principle of this topic?`,
      options: [
        `Core principles require understanding fundamental definitions and standard models within ${topicName}`,
        `Terminology in this field is arbitrary and has no relationship to practical observation`,
        `Advanced models completely invalidate all introductory definitions in this domain`,
        `Empirical data cannot be systematized within this subject area`
      ],
      correctIndex: 0,
      explanation: `Mastering foundational concepts in ${topicName} forms the baseline prerequisite for higher-order problem solving.`
    },
    2: {
      question: `In the context of "${topicName}" with difficulty bound "${difficultyBounds.slice(0, 40)}...": How does one systematically approach intermediate problem-solving?`,
      options: [
        `Isolating variables, identifying governing laws, and testing boundary conditions`,
        `Relying purely on intuitive guesswork without checking units or hypotheses`,
        `Assuming all systems operate under idealized equilibrium at all times`,
        `Ignoring edge cases and boundary limitations described in the problem scope`
      ],
      correctIndex: 0,
      explanation: `Systematic problem-solving in ${topicName} relies on decomposing parameters and rigorously applying relevant framework mechanisms.`
    },
    3: {
      question: `Synthesizing concepts in "${topicName}" (${scope.slice(0, 45)}...): What distinguishes advanced mastery in this topic?`,
      options: [
        `The ability to evaluate complex trade-offs, reconcile competing models, and predict system behaviors`,
        `Memorizing raw facts without understanding underlying causal relationships`,
        `Treating all theoretical models as universally applicable without scope constraints`,
        `Discarding mathematical rigor in favor of simplified qualitative assertions`
      ],
      correctIndex: 0,
      explanation: `Advanced mastery requires synthesizing multiple concepts, evaluating constraints, and understanding where theoretical models apply.`
    }
  };

  return tierQuestions[tier] || tierQuestions[1];
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

