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
// Quiz Question Generation Endpoint
app.post('/api/generate-question', async (req, res) => {
  const {
    topicName = 'General Academics',
    scope = 'General knowledge and foundational principles',
    difficultyBounds = 'Introductory undergraduate level',
    tier = 1,
    upgradeName = 'Study Upgrade',
    previousQuestions = [],
    apiKey: clientApiKey
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

  // Attempt Gemini API if GEMINI_API_KEY is configured or passed from client
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
  if (apiKey) {
    const candidateModels = [
      'gemini-3-flash-preview',
      process.env.GEMINI_MODEL,
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro'
    ].filter(Boolean);

    const prompt = `You are a distinguished university professor creating an exam checkpoint question for a student.

STUDY SESSION GUIDELINES (DEFINED BY THE STUDENT):
- Subject / Course: ${topicName}
- Scope & Content Boundaries: ${scope}
- Difficulty Level & Bounds: ${difficultyBounds}
- Progression Tier: ${tierLabel}
- Checkpoint Item: "${upgradeName}"
${avoidList}
CRITICAL REQUIREMENTS - STRICT SCOPE & DIFFICULTY ADHERENCE:
1. ZERO OUT-OF-SCOPE CONTENT:
   - Your question and ALL 4 options MUST be strictly and entirely within the "Scope & Content Boundaries" (${scope}) and "Difficulty Level & Bounds" (${difficultyBounds}) specified above.
   - Respect all limits, inclusions, and explicit exclusions specified by the student (e.g. if the scope specifies certain chapters or says "do NOT include X" or "only Y", you must strictly follow those boundaries).
   - NEVER introduce concepts, mechanisms, or advanced terminology that lie outside the student's defined scope or beyond the specified difficulty level.
   - Ask a concrete, factual, rigorous academic question testing actual knowledge in ${topicName} (predict the product, identify the mechanism, determine the outcome, compare the principles). Do NOT generate generic or meta-questions.

2. AVOID REPETITION WHILE REMAINING IN SCOPE:
   - Do not repeat or closely rephrase any of the previously asked questions listed above.
   - Explore different concepts, definitions, rules, examples, or applications, but ALWAYS stay 100% inside the student's defined scope.

3. QUESTION FORMAT:
   - Exactly ONE multiple-choice question.
   - Exactly 4 plausible options (Option A, B, C, D) of roughly comparable length.
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
                temperature: 0.2,
                topP: 0.95
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

  // Fallback domain-aware, scope-matching generator with rich question pools
  const fallbackQuestion = generateFallbackQuestion(topicName, scope, difficultyBounds, tier, previousQuestions);
  res.json({ ...fallbackQuestion, source: 'offline-procedural' });
});

// Common stop words to ignore when tokenizing scope
const STOP_WORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'also', 'and', 'any', 'are', 'because',
  'been', 'before', 'being', 'between', 'both', 'chapter', 'chapters', 'class', 'course',
  'define', 'does', 'doing', 'down', 'during', 'each', 'exam', 'focus', 'from', 'further',
  'here', 'into', 'just', 'more', 'most', 'only', 'other', 'over', 'same', 'should',
  'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'under', 'until', 'very', 'what', 'when', 'where',
  'which', 'while', 'who', 'whom', 'will', 'with', 'would'
]);

// Extract terms explicitly excluded by student in scope
function extractExcludedTerms(scopeText) {
  const excluded = [];
  const patterns = [
    /(?:no|not|without|exclude|excluding|skip|don't include|do not include)\s+([^,.;]+)/gi
  ];
  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(scopeText)) !== null) {
      const phrase = match[1].toLowerCase().trim();
      const words = phrase.split(/[^a-z0-9_-]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
      excluded.push(...words);
    }
  }
  return [...new Set(excluded)];
}

// Master academic question bank with detailed tags & difficulty tiers
const ACADEMIC_QUESTION_BANK = [
  // --- ORGANIC CHEMISTRY: CARBONYLS, ALDEHYDES & KETONES ---
  {
    tags: ['aldehyde', 'ketone', 'carbonyl', 'nucleophilic', 'addition', 'acetal', 'alcohol', 'grignard'],
    tier: 1,
    question: 'In carbonyl chemistry, what functional group is formed when an aldehyde reacts with an alcohol in the presence of an acid catalyst in a 1:1 molar ratio?',
    options: ['Hemiacetal', 'Acetal', 'Carboxylic acid', 'Enol ether'],
    correctIndex: 0,
    explanation: 'A 1:1 reaction of an aldehyde and alcohol under acid catalysis forms a hemiacetal with a hydroxyl and alkoxy group on the same carbon.'
  },
  {
    tags: ['aldehyde', 'ketone', 'carbonyl', 'nucleophilic', 'addition', 'electrophilic', 'reactivity'],
    tier: 1,
    question: 'Why are aldehydes generally more reactive toward nucleophilic addition than otherwise similar ketones?',
    options: ['Aldehydes have less steric hindrance and greater partial positive charge on the carbonyl carbon', 'Ketones have a higher bond dissociation energy for the C=O pi bond', 'Aldehydes form more stable free-radical intermediates', 'Ketones lack alpha hydrogens required for nucleophilic attack'],
    correctIndex: 0,
    explanation: 'Aldehydes possess only one electron-donating alkyl group and less steric hindrance, making their carbonyl carbon significantly more electrophilic than that of ketones.'
  },
  {
    tags: ['aldehyde', 'ketone', 'carbonyl', 'reduction', 'nabh4', 'lialh4', 'hydride'],
    tier: 1,
    question: 'Which reagent selectively reduces aldehydes and ketones to alcohols without reducing esters, amides, or carboxylic acids?',
    options: ['Sodium borohydride (NaBH₄)', 'Lithium aluminum hydride (LiAlH₄)', 'Potassium permanganate (KMnO₄)', 'Chromic acid (H₂CrO₄)'],
    correctIndex: 0,
    explanation: 'NaBH4 is a mild reducing agent that readily reduces aldehydes and ketones, whereas esters and carboxylic acids require the stronger LiAlH4.'
  },
  {
    tags: ['aldehyde', 'ketone', 'carbonyl', 'grignard', 'addition', 'organometallic', 'tertiary'],
    tier: 2,
    question: 'When a Grignard reagent (R-MgBr) nucleophilically attacks an acyclic ketone followed by aqueous acid workup, what product is formed?',
    options: ['A tertiary alcohol', 'A secondary alcohol', 'A primary alcohol', 'An ester'],
    correctIndex: 0,
    explanation: 'Ketones already possess two alkyl substituents; addition of a third carbanionic group from a Grignard reagent produces a tertiary alcohol.'
  },
  {
    tags: ['aldehyde', 'ketone', 'carbonyl', 'acetal', 'protecting', 'diol', 'condensation'],
    tier: 2,
    question: 'Why is ethylene glycol (HO-CH₂CH₂-OH) frequently reacted with ketones in the presence of catalytic acid in synthetic sequences?',
    options: ['To form a cyclic 1,3-dioxolane acetal that protects the carbonyl from nucleophiles and bases', 'To irreversibly oxidize the ketone to a dicarboxylic acid', 'To convert the ketone directly into an internal alkyne', 'To halogenate the alpha carbon under mild conditions'],
    correctIndex: 0,
    explanation: 'Ethylene glycol forms a stable cyclic acetal (1,3-dioxolane) that serves as a protecting group against bases, Grignards, and hydrides, removable via aqueous acid.'
  },
  {
    tags: ['aldehyde', 'ketone', 'carbonyl', 'wittig', 'alkene', 'ylide'],
    tier: 3,
    question: 'During the Wittig reaction of a carbonyl with a triphenylphosphonium ylide, what cyclic four-membered intermediate is formed prior to alkene release?',
    options: ['Oxaphosphetane', 'Beta-lactone', 'Epoxide', 'Dioxetane'],
    correctIndex: 0,
    explanation: 'The [2+2] cycloaddition of the phosphonium ylide with the carbonyl forms an oxaphosphetane intermediate, whose collapse is driven by the thermodynamic stability of the P=O bond.'
  },

  // --- ORGANIC CHEMISTRY: ENOLATES & ALDOL CONDENSATION ---
  {
    tags: ['enolate', 'aldol', 'alpha', 'hydrogen', 'acidity', 'tautomerism', 'carbonyl'],
    tier: 1,
    question: 'Why are alpha-hydrogens adjacent to a carbonyl group significantly more acidic (pKa ~16–20) than typical alkane hydrogens (pKa ~50)?',
    options: ['The conjugate base enolate is resonance-stabilized with negative charge delocalized onto oxygen', 'The carbonyl oxygen directly donates electron density to weaken the alpha C-H sigma bond', 'The alpha carbon is sp-hybridized, conferring high s-character', 'Steric repulsion between the alpha protons forces spontaneous heterolytic cleavage'],
    correctIndex: 0,
    explanation: 'Deprotonation yields a resonance-stabilized enolate anion where the negative charge is delocalized onto the electronegative carbonyl oxygen.'
  },
  {
    tags: ['aldol', 'enolate', 'condensation', 'dehydration', 'conjugated', 'carbonyl'],
    tier: 2,
    question: 'What is the characteristic product of an aldol reaction followed by base-catalyzed dehydration (aldol condensation)?',
    options: ['An α,β-unsaturated aldehyde or ketone', 'A β-hydroxy aldehyde or ketone', 'A cyclic diester', 'A 1,3-dicarbonyl compound'],
    correctIndex: 0,
    explanation: 'Heating an aldol adduct causes elimination of water (dehydration) to form an alpha,beta-unsaturated carbonyl compound with extended conjugation.'
  },
  {
    tags: ['enolate', 'kinetic', 'thermodynamic', 'regioselectivity', 'lda'],
    tier: 3,
    question: 'Which reaction conditions favor the formation of the kinetic enolate over the thermodynamic enolate for an asymmetric ketone?',
    options: ['Strong, bulky, non-nucleophilic base (e.g. LDA) at low temperature (-78°C)', 'Weaker base (e.g. ethoxide) at room temperature with slight excess of ketone', 'Concentrated sulfuric acid at elevated temperature (reflux)', 'Catalytic sodium hydroxide in protic ethanol at 60°C'],
    correctIndex: 0,
    explanation: 'A bulky base like LDA at -78°C deprotonates the least sterically hindered alpha carbon rapidly and irreversibly, yielding the kinetic enolate.'
  },

  // --- ORGANIC CHEMISTRY: SUBSTITUTION, ELIMINATION & STEREOCHEMISTRY ---
  {
    tags: ['sn2', 'substitution', 'inversion', 'walden', 'kinetics', 'bimolecular'],
    tier: 1,
    question: 'Which mechanism proceeds through a single concerted bimolecular step with complete stereochemical inversion (Walden inversion)?',
    options: ['S_N2 substitution', 'S_N1 substitution', 'E1 elimination', 'E2 elimination'],
    correctIndex: 0,
    explanation: 'S_N2 involves backside nucleophilic attack in a single concerted step, which inverts the stereochemistry at the reacting sp3 carbon.'
  },
  {
    tags: ['e2', 'elimination', 'anti-periplanar', 'stereoelectronic', 'alkene'],
    tier: 2,
    question: 'In an E2 elimination reaction of an alkyl halide, what geometric arrangement between the beta-hydrogen and the leaving group is required for optimal orbital overlap?',
    options: ['Anti-periplanar (180° dihedral angle)', 'Syn-coplanar (0° dihedral angle)', 'Gauche (60° dihedral angle)', 'Orthogonal (90° dihedral angle)'],
    correctIndex: 0,
    explanation: 'Anti-periplanar geometry aligns the breaking C-H and C-X sigma bonds in the same plane, facilitating concerted overlap into the forming pi bond.'
  },
  {
    tags: ['sn1', 'carbocation', 'racemization', 'hyperconjugation', 'solvolysis'],
    tier: 2,
    question: 'Why does an S_N1 substitution reaction at a chiral center typically produce a racemic mixture rather than pure retention or inversion?',
    options: ['The planar sp²-hybridized carbocation intermediate can be attacked by nucleophiles from either face with comparable probability', 'The leaving group rotates 180 degrees before the nucleophile coordinates', 'The solvent forces an equilibrium between cis and trans conformers', 'The reaction proceeds through a cyclic bromonium ion intermediate'],
    correctIndex: 0,
    explanation: 'Loss of the leaving group yields a planar, achiral carbocation (sp2); the nucleophile can attack from the top or bottom face, resulting in racemization.'
  },

  // --- GENERAL CHEMISTRY: EQUILIBRIUM & LE CHATELIER ---
  {
    tags: ['equilibrium', 'le chatelier', 'exothermic', 'temperature', 'kc', 'kp'],
    tier: 1,
    question: 'For an exothermic reversible reaction at dynamic chemical equilibrium, how does an increase in temperature affect the equilibrium constant (K)?',
    options: ['K decreases and the equilibrium shifts toward the reactants', 'K increases and the equilibrium shifts toward the products', 'K remains unchanged because only catalysts alter equilibrium constants', 'K doubles for every 10°C increase regardless of reaction enthalpy'],
    correctIndex: 0,
    explanation: 'In an exothermic reaction, heat is a product. Adding thermal energy shifts equilibrium toward reactants, reducing the numerical value of K.'
  },
  {
    tags: ['equilibrium', 'reaction quotient', 'q', 'kc', 'spontaneity'],
    tier: 2,
    question: 'If the reaction quotient Q for a system is strictly less than the equilibrium constant K (Q < K), in which direction will the net reaction proceed?',
    options: ['Forward (toward products) to consume reactants', 'Reverse (toward reactants) to consume products', 'The system is already at dynamic equilibrium and no net change occurs', 'The reaction ceases completely due to thermodynamic arrest'],
    correctIndex: 0,
    explanation: 'When Q < K, the concentration ratio of products to reactants is lower than at equilibrium, driving the net forward reaction until Q = K.'
  },

  // --- GENERAL CHEMISTRY: THERMODYNAMICS & KINETICS ---
  {
    tags: ['thermodynamics', 'gibbs', 'enthalpy', 'entropy', 'delta g', 'spontaneous'],
    tier: 1,
    question: 'Under what thermodynamic conditions is a chemical reaction guaranteed to be spontaneous (ΔG < 0) at all temperatures?',
    options: ['Negative enthalpy change (ΔH < 0) and positive entropy change (ΔS > 0)', 'Positive enthalpy change (ΔH > 0) and negative entropy change (ΔS < 0)', 'Negative enthalpy change (ΔH < 0) and negative entropy change (ΔS < 0)', 'Positive enthalpy change (ΔH > 0) and positive entropy change (ΔS > 0)'],
    correctIndex: 0,
    explanation: 'Using ΔG = ΔH - TΔS, when ΔH is negative and ΔS is positive, ΔG is mathematically negative at every non-negative absolute temperature.'
  },
  {
    tags: ['kinetics', 'rate law', 'order', 'arrhenius', 'activation energy'],
    tier: 2,
    question: 'If a chemical reaction is second-order with respect to reactant A (Rate = k[A]²), how does tripling the concentration of A change the initial rate?',
    options: ['The rate increases by a factor of 9', 'The rate increases by a factor of 3', 'The rate increases by a factor of 6', 'The rate remains unchanged'],
    correctIndex: 0,
    explanation: 'Rate ∝ [A]^2. Multiplying [A] by 3 increases the rate by (3)^2 = 9.'
  },
  {
    tags: ['acid', 'base', 'buffer', 'ph', 'pka', 'henderson-hasselbalch'],
    tier: 1,
    question: 'According to the Henderson-Hasselbalch equation, what is the pH of a buffer solution when the molar concentration of conjugate base equals the weak acid ([A⁻] = [HA])?',
    options: ['pH = pK_a', 'pH = 7.00', 'pH = pK_a + 1.0', 'pH = 14 - pK_a'],
    correctIndex: 0,
    explanation: 'Because pH = pKa + log([A-]/[HA]) and log(1) = 0, the pH equals pKa when base and acid concentrations are equal.'
  },

  // --- BIOLOGY: CELL BIOLOGY & MEMBRANE TRANSPORT ---
  {
    tags: ['cell', 'membrane', 'active transport', 'atp', 'na+/k+', 'pump'],
    tier: 1,
    question: 'What mechanism moves ions or solutes against their electrochemical gradient by directly coupling to the hydrolysis of ATP?',
    options: ['Primary active transport', 'Facilitated diffusion', 'Simple diffusion', 'Secondary active transport (cotransport)'],
    correctIndex: 0,
    explanation: 'Primary active transport (such as the Na+/K+ ATPase pump) directly hydrolyzes ATP to move solutes against their electrochemical gradient.'
  },
  {
    tags: ['organelle', 'lysosome', 'hydrolase', 'acidic', 'cell'],
    tier: 1,
    question: 'Which eukaryotic organelle maintains an internal lumen of pH ~4.5–5.0 and contains acid hydrolases for macromolecular degradation?',
    options: ['Lysosome', 'Peroxisome', 'Rough endoplasmic reticulum', 'Proteasome'],
    correctIndex: 0,
    explanation: 'Lysosomes contain acid hydrolases that function optimally at acidic pH to degrade macromolecules, cellular debris, and endocytosed pathogens.'
  },

  // --- BIOLOGY: MOLECULAR GENETICS & CENTRAL DOGMA ---
  {
    tags: ['dna', 'replication', 'primase', 'polymerase', 'primer', 'lagging'],
    tier: 1,
    question: 'During eukaryotic DNA replication, which enzyme synthesizes the short RNA primers required for DNA polymerase to initiate synthesis?',
    options: ['DNA Primase', 'DNA Topoisomerase (Gyrase)', 'DNA Ligase', 'Single-Stranded Binding Protein (SSB)'],
    correctIndex: 0,
    explanation: 'DNA polymerases cannot initiate de novo strand synthesis without a free 3\'-OH; DNA primase creates a complementary RNA primer to initiate extension.'
  },
  {
    tags: ['dna', 'proofreading', 'exonuclease', 'fidelity', 'polymerase'],
    tier: 2,
    question: 'What catalytic activity of replicative DNA polymerases allows them to excise incorrectly incorporated nucleotides during synthesis?',
    options: ['3\' to 5\' exonuclease activity', '5\' to 3\' endonuclease activity', 'RNA-dependent polymerase activity', 'Topoisomerase relaxation activity'],
    correctIndex: 0,
    explanation: 'Replicative DNA polymerases have a distinct 3\' to 5\' proofreading exonuclease active site that removes mismatched terminal bases.'
  },

  // --- BIOLOGY: NEUROSCIENCE & PHYSIOLOGY ---
  {
    tags: ['neuron', 'action potential', 'sodium', 'potassium', 'depolarization', 'channels'],
    tier: 1,
    question: 'During a neuronal action potential, what event is directly responsible for the rapid depolarizing upstroke?',
    options: ['Rapid opening of voltage-gated Na⁺ channels causing massive Na⁺ influx', 'Opening of voltage-gated K⁺ channels causing K⁺ efflux', 'Active outward pumping of Ca²⁺ ions by ATPases', 'Inactivation of resting chloride leak channels'],
    correctIndex: 0,
    explanation: 'Reaching threshold opens voltage-gated Na+ channels rapidly, driving a massive inward flux of Na+ down its electrochemical gradient.'
  },
  {
    tags: ['synapse', 'calcium', 'neurotransmitter', 'exocytosis', 'presynaptic'],
    tier: 2,
    question: 'What ion influx into the presynaptic terminal triggers the fusion of neurotransmitter vesicles with the presynaptic membrane?',
    options: ['Calcium (Ca²⁺) influx through voltage-gated Ca²⁺ channels', 'Sodium (Na⁺) influx through ligand-gated channels', 'Potassium (K⁺) efflux through delayed rectifiers', 'Chloride (Cl⁻) influx via ionotropic receptors'],
    correctIndex: 0,
    explanation: 'Depolarization of the axon terminal activates voltage-gated Ca2+ channels; Ca2+ influx binds synaptotagmin to trigger SNARE-mediated vesicle fusion.'
  },

  // --- COMPUTER SCIENCE: DATA STRUCTURES ---
  {
    tags: ['data structure', 'bst', 'binary search tree', 'avl', 'tree', 'complexity'],
    tier: 1,
    question: 'In a self-balancing binary search tree (such as an AVL or Red-Black tree) with n elements, what is the worst-case time complexity to search for a key?',
    options: ['O(log n)', 'O(n)', 'O(1)', 'O(n log n)'],
    correctIndex: 0,
    explanation: 'Self-balancing BSTs maintain height proportional to log2(n), guaranteeing O(log n) worst-case time for search, insertion, and deletion.'
  },
  {
    tags: ['hash table', 'collision', 'separate chaining', 'data structure', 'bucket'],
    tier: 1,
    question: 'How does a hash table utilizing separate chaining resolve key collisions?',
    options: ['By storing colliding key-value pairs in a linked list or bucket at that index', 'By probing sequentially to the next open contiguous array slot', 'By immediately doubling table size and rehashing all keys', 'By replacing older keys using a LRU eviction policy'],
    correctIndex: 0,
    explanation: 'Separate chaining maintains a linked list or secondary container at each hash bucket to hold multiple keys that evaluate to the same index.'
  },

  // --- COMPUTER SCIENCE: ALGORITHMS & COMPLEXITY ---
  {
    tags: ['algorithm', 'merge sort', 'sorting', 'complexity', 'big-o', 'divide and conquer'],
    tier: 1,
    question: 'What is the worst-case time complexity of Merge Sort when sorting an array of n elements?',
    options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
    correctIndex: 0,
    explanation: 'Merge Sort consistently divides the input array in half (log n levels) and performs O(n) merging work across all levels, guaranteeing O(n log n).'
  },
  {
    tags: ['algorithm', 'dynamic programming', 'dp', 'memoization', 'overlapping subproblems'],
    tier: 2,
    question: 'What two core properties must an algorithmic problem exhibit to be effectively solvable using Dynamic Programming?',
    options: ['Optimal substructure and overlapping subproblems', 'Greedy choice property and polynomial complexity', 'Divide-and-conquer independence and constant space bounds', 'Deterministic finite state transitions and acyclic recursion'],
    correctIndex: 0,
    explanation: 'Dynamic programming requires that optimal solutions are built from optimal subproblems (optimal substructure) and that the same subproblems are solved repeatedly (overlapping subproblems).'
  },
  {
    tags: ['operating system', 'threads', 'process', 'concurrency', 'memory', 'heap'],
    tier: 2,
    question: 'What memory region is shared directly between multiple execution threads within the same operating system process?',
    options: ['The heap space and global data segments', 'The call stack and stack pointer register', 'The program counter and CPU register sets', 'Thread-local storage (TLS) buffers'],
    correctIndex: 0,
    explanation: 'Threads share the parent process\'s virtual address space, heap, and open file descriptors, but each thread has its own private stack and register state.'
  },

  // --- MATHEMATICS & PHYSICS ---
  {
    tags: ['calculus', 'chain rule', 'derivative', 'composite'],
    tier: 1,
    question: 'Using the Chain Rule of calculus, what is the derivative of the composite function f(g(x)) with respect to x?',
    options: ['f\'(g(x)) · g\'(x)', 'f\'(x) · g\'(x)', 'f\'(g\'(x))', 'f(x) · g\'(x) + f\'(x) · g(x)'],
    correctIndex: 0,
    explanation: 'The chain rule multiplies the derivative of the outer function evaluated at the inner function by the derivative of the inner function.'
  },
  {
    tags: ['linear algebra', 'matrix', 'eigenvalue', 'eigenvector', 'determinant'],
    tier: 2,
    question: 'For a square matrix A and non-zero vector v, what condition defines v as an eigenvector corresponding to scalar eigenvalue λ?',
    options: ['Av = λv', 'A + v = λI', 'vᵀAv = λ', 'A⁻¹v = λv'],
    correctIndex: 0,
    explanation: 'An eigenvector v satisfies Av = λv, indicating that matrix transformation by A merely scales v by factor λ without rotating its direction.'
  },
  {
    tags: ['physics', 'mechanics', 'momentum', 'conservation', 'force', 'newton'],
    tier: 1,
    question: 'Under what physical condition is the total linear momentum of a multi-body mechanical system strictly conserved?',
    options: ['When the net external force acting on the system is zero (ΣF_ext = 0)', 'When no mechanical energy is converted into internal thermal energy', 'When all particles travel at constant relativistic speeds', 'Only when all collisions within the system are perfectly elastic'],
    correctIndex: 0,
    explanation: 'From Newton\'s second law (dp/dt = ΣF_ext), momentum is conserved over time whenever net external forces equal zero.'
  },
  {
    tags: ['electromagnetism', 'faraday', 'induction', 'lenz', 'magnetic flux', 'emf'],
    tier: 2,
    question: 'According to Faraday\'s Law of Induction, what induces an electromotive force (EMF) in a closed conducting loop?',
    options: ['A time-varying magnetic flux passing through the loop surface (dΦ_B/dt ≠ 0)', 'A constant, uniform, static magnetic field perpendicular to the loop', 'A stationary electrostatic charge positioned at the geometric center of the loop', 'A constant direct current flowing in an isolated parallel wire'],
    correctIndex: 0,
    explanation: 'Faraday\'s law states that EMF = -dΦ_B/dt; an electromotive force is induced only when the magnetic flux through the loop changes with time.'
  },

  // --- ECONOMICS ---
  {
    tags: ['economics', 'elasticity', 'demand', 'revenue', 'price'],
    tier: 1,
    question: 'When the price elasticity of demand for a good is price-elastic (|E_d| > 1), how does an increase in price affect total revenue?',
    options: ['Total revenue decreases', 'Total revenue increases', 'Total revenue remains exactly constant', 'Total revenue drops immediately to zero'],
    correctIndex: 0,
    explanation: 'When demand is elastic (|Ed| > 1), quantity demanded drops by a larger percentage than the price increase, causing total revenue to fall.'
  },
  {
    tags: ['economics', 'profit maximization', 'marginal revenue', 'marginal cost', 'microeconomics'],
    tier: 2,
    question: 'In microeconomic theory, at what output level does any profit-maximizing firm choose to operate in both competitive and monopoly markets?',
    options: ['Where marginal revenue equals marginal cost (MR = MC)', 'Where price equals average total cost (P = ATC)', 'Where total revenue is at its maximum possible peak', 'Where marginal cost reaches its absolute minimum'],
    correctIndex: 0,
    explanation: 'A firm maximizes profit by expanding production until the additional revenue from the last unit equals the additional cost to produce it (MR = MC).'
  },

  // --- PSYCHOLOGY ---
  {
    tags: ['psychology', 'classical conditioning', 'pavlov', 'conditioned stimulus', 'cs'],
    tier: 1,
    question: 'In classical conditioning, what term describes a previously neutral stimulus that, after repeated pairing with an unconditioned stimulus, elicits a conditioned response?',
    options: ['Conditioned stimulus (CS)', 'Unconditioned stimulus (UCS)', 'Operant reinforcer', 'Discriminative stimulus'],
    correctIndex: 0,
    explanation: 'Through contingent pairing with an unconditioned stimulus, the formerly neutral stimulus acquires the capacity to evoke the response as a conditioned stimulus.'
  },
  {
    tags: ['psychology', 'memory', 'hippocampus', 'consolidation', 'brain'],
    tier: 2,
    question: 'Which medial temporal lobe structure is critically required for the consolidation of short-term memories into permanent long-term declarative memories?',
    options: ['Hippocampus', 'Cerebellum', 'Medulla oblongata', 'Occipital cortex'],
    correctIndex: 0,
    explanation: 'The hippocampus is essential for consolidating episodic and semantic information from temporary representations into long-term neocortical networks.'
  }
];

// Fallback procedural question generator with keyword scoring & dynamic concept synthesis
function generateFallbackQuestion(topicName, scope, difficultyBounds, tier, previousQuestions = []) {
  const cleanTopic = topicName.toLowerCase();
  const cleanScope = scope.toLowerCase();
  const excludedWords = extractExcludedTerms(scope);
  const prevAsked = Array.isArray(previousQuestions) ? previousQuestions : [];

  // Score all questions in our comprehensive academic bank
  const scoredQuestions = ACADEMIC_QUESTION_BANK.map(q => {
    let score = 0;
    const qText = `${q.question} ${q.options.join(' ')} ${q.explanation} ${(q.tags || []).join(' ')}`.toLowerCase();

    // Check disqualifications: if any excluded word appears in the question or tags
    for (const excluded of excludedWords) {
      if (excluded.length > 2 && qText.includes(excluded)) {
        return { question: q, score: -999 };
      }
    }

    // Penalize questions already asked recently in this session
    for (const prev of prevAsked) {
      if (prev && q.question.toLowerCase().includes(prev.toLowerCase().slice(0, 35))) {
        score -= 80;
      }
    }

    // Match requested tier
    if (q.tier === tier) {
      score += 4;
    }

    // Check tags against scope and topic
    if (Array.isArray(q.tags)) {
      for (const tag of q.tags) {
        if (cleanScope.includes(tag)) {
          score += 12; // Massive boost for matching student's explicit scope!
        } else if (cleanTopic.includes(tag)) {
          score += 6;
        }
      }
    }

    // Direct word overlap from student scope
    const scopeWords = cleanScope.split(/[^a-z0-9_-]+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
    for (const sw of scopeWords) {
      if (qText.includes(sw)) {
        score += 4;
      }
    }

    // Direct word overlap from student topic
    const topicWords = cleanTopic.split(/[^a-z0-9_-]+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
    for (const tw of topicWords) {
      if (qText.includes(tw)) {
        score += 2;
      }
    }

    return { question: q, score };
  });

  // Filter out disqualified questions and sort by score descending
  const candidates = scoredQuestions
    .filter(sq => sq.score > 0)
    .sort((a, b) => b.score - a.score);

  // If we found strong matches (score >= 8 indicates genuine topic/scope alignment)
  if (candidates.length > 0 && candidates[0].score >= 8) {
    // Pick randomly from top matching questions to avoid immediate repetition
    const topScore = candidates[0].score;
    const topCandidates = candidates.filter(c => c.score >= topScore - 6);
    const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)].question;
    return shuffleQuestion(chosen);
  }

  // If no bank question achieved strong scope alignment, synthesize a targeted question directly using the student's terms!
  return synthesizeDynamicQuestion(topicName, scope, difficultyBounds, tier, prevAsked);
}

// Synthesize an academically grounded question when custom scope terms are provided
function synthesizeDynamicQuestion(topicName, scope, difficultyBounds, tier, previousQuestions = []) {
  // Extract key concept phrases from student's scope
  const clauses = scope
    .split(/[,;\n\r\t]+/)
    .map(c => c.replace(/^(chapters?\s*\d+(-\d+)?\s*:?|topics?\s*:?|focus\s*on\s*:?|including\s*:?|modules?\s*\d*\s*:?)/i, '').trim())
    .filter(c => c.length >= 3 && !/^(no|not|without|do not|exclude|skip)/i.test(c));

  const rawTerms = [];
  for (const c of clauses) {
    if (c.length < 50 && !rawTerms.includes(c)) {
      rawTerms.push(c);
    }
  }

  const primaryTerm = rawTerms[0] || topicName;
  const secondaryTerm = rawTerms[1] || `${primaryTerm} principles`;
  const tertiaryTerm = rawTerms[2] || `governing parameters in ${topicName}`;

  if (tier === 1) {
    return shuffleQuestion({
      question: `In ${topicName}, what is the foundational role or governing definition of ${primaryTerm}?`,
      options: [
        `It serves as a primary functional principle or structural benchmark within ${topicName}`,
        `It represents an obsolete approximation that is categorically violated under standard conditions`,
        `It acts strictly as an unreactive background variable with no measurable influence on ${secondaryTerm}`,
        `It is completely identical in definition, symmetry, and function to ${tertiaryTerm}`
      ],
      correctIndex: 0,
      explanation: `Within ${topicName}, understanding ${primaryTerm} is foundational for establishing boundary conditions and analyzing related behaviors.`
    });
  } else if (tier === 2) {
    return shuffleQuestion({
      question: `When analyzing problem scenarios involving ${primaryTerm} in ${topicName}: What governs its interaction or transition with ${secondaryTerm}?`,
      options: [
        `Specific mechanistic conditions dictate rate, pathway selectivity, and intermediate stability between them`,
        `The interaction is purely stochastic with no thermodynamic or kinetic constraints`,
        `Altering ${primaryTerm} has zero effect on the outcome of ${secondaryTerm}`,
        `They cannot coexist under any bounded physical or theoretical framework`
      ],
      correctIndex: 0,
      explanation: `Systematic problem-solving in ${topicName} requires tracing the mechanistic path and governing constraints that link ${primaryTerm} and ${secondaryTerm}.`
    });
  } else {
    return shuffleQuestion({
      question: `In advanced ${topicName}, what critical trade-off or boundary condition governs ${primaryTerm} when evaluating ${secondaryTerm}?`,
      options: [
        `Competing kinetic and thermodynamic pathways dictate selectivity and define limits of standard approximations`,
        `Higher-order effects can always be discarded without affecting accuracy or predictive power`,
        `Equilibrium remains unchanged regardless of temperature, pressure, or concentration shifts`,
        `Linear first-order approximations apply universally across all extreme edge cases`
      ],
      correctIndex: 0,
      explanation: `Advanced mastery of ${topicName} involves evaluating where idealized models break down and reconciling competing mechanisms in ${primaryTerm}.`
    });
  }
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

