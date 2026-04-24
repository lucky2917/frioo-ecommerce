
const FRUITS = {
    apple: { id: "apple", tier: "low", hydration: 6, fiber: 7, gi: 5, antioxidant: 6, digestion: 7, title: "Apple", price: 20 },
    banana: { id: "banana", tier: "low", hydration: 5, fiber: 6, gi: 7, antioxidant: 5, digestion: 8, title: "Banana", price: 10 },
    papaya: { id: "papaya", tier: "low", hydration: 7, fiber: 8, gi: 4, antioxidant: 7, digestion: 10, title: "Papaya", price: 25 },
    watermelon: { id: "watermelon", tier: "low", hydration: 10, fiber: 4, gi: 6, antioxidant: 6, digestion: 6, title: "Watermelon", price: 30 },
    orange: { id: "orange", tier: "low", hydration: 8, fiber: 6, gi: 5, antioxidant: 8, digestion: 7, title: "Orange", price: 20 },
    guava: { id: "guava", tier: "low", hydration: 5, fiber: 10, gi: 5, antioxidant: 7, digestion: 7, title: "Guava", price: 15 },
    grapes_ind: { id: "grapes_ind", tier: "low", hydration: 5, fiber: 4, gi: 7, antioxidant: 7, digestion: 6, title: "Indian Grapes", price: 35 },

    pomegranate: { id: "pomegranate", tier: "mid", hydration: 6, fiber: 8, gi: 4, antioxidant: 9, digestion: 7, title: "Pomegranate", price: 60 },
    pineapple: { id: "pineapple", tier: "mid", hydration: 7, fiber: 4, gi: 7, antioxidant: 6, digestion: 8, title: "Pineapple", price: 50 },
    plum: { id: "plum", tier: "mid", hydration: 5, fiber: 5, gi: 5, antioxidant: 7, digestion: 7, title: "Plum", price: 45 },

    kiwi: { id: "kiwi", tier: "high", hydration: 6, fiber: 6, gi: 4, antioxidant: 10, digestion: 8, title: "Kiwi", price: 80 },
    dragonfruit: { id: "dragonfruit", tier: "high", hydration: 9, fiber: 6, gi: 4, antioxidant: 7, digestion: 8, title: "Dragonfruit", price: 90 },
    blueberry: { id: "blueberry", tier: "high", hydration: 4, fiber: 5, gi: 4, antioxidant: 10, digestion: 7, title: "Blueberry", price: 120 },
    avocado: { id: "avocado", tier: "high", hydration: 4, fiber: 8, gi: 2, antioxidant: 8, digestion: 9, title: "Avocado", price: 100 },
    grapes_aus: { id: "grapes_aus", tier: "high", hydration: 5, fiber: 4, gi: 7, antioxidant: 8, digestion: 6, title: "Australian Grapes", price: 110 }
};

function computeUserSignals(user) {
    const weight = Number(user.weight) || 70;
    const height = Number(user.height) || 170;
    const sleep = Number(user.sleep) || 7;
    const water = Number(user.water) || 2;

    const bmi = weight / ((height / 100) ** 2);
    const hydrationNeed = Math.max(0, (weight * 0.03) - water);
    const sleepDebt = Math.max(0, 8 - sleep);
    const stressLoad = user.stress === "high" ? 2 : user.stress === "medium" ? 1 : 0;

    return { bmi, hydrationNeed, sleepDebt, stressLoad };
}

function scoreFruit(fruit, signals, goal) {
    let score = 0;

    score += fruit.hydration * (signals.hydrationNeed > 0 ? 1.2 : 0.8);
    score += fruit.fiber * (goal === "weight_loss" ? 1.5 : 1);
    score += fruit.antioxidant * (signals.stressLoad + 1);
    score += fruit.digestion;

    if (goal === "energy") score += fruit.gi;
    if (goal === "gut_health") score += fruit.digestion * 1.5;
    if (goal === "skin_glow") score += fruit.antioxidant + fruit.hydration;

    return score;
}

function buildBestSalad(allowedFruits, scores, min = 4, max = 7) {
    let best = null;

    for (let i = 0; i < 6; i++) {
        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        const selected = [...allowedFruits].sort(() => 0.5 - Math.random()).slice(0, count);

        const total = selected.reduce((sum, f) => sum + (scores[f] || 0), 0);

        const totalPrice = selected.reduce((sum, f) => sum + FRUITS[f].price, 0);

        if (!best || total > best.score) {
            best = {
                fruits: selected.map(key => FRUITS[key]),
                score: total,
                price: totalPrice
            };
        }
    }

    return best || { fruits: [], score: 0, price: 0 };
}

export function runFriooAI(user) {
    const signals = computeUserSignals(user);
    const allergies = (user.allergies || []).map(a => a.toLowerCase()); // Ensure lower case match

    const safeFruits = Object.keys(FRUITS).filter(f => !allergies.includes(f));

    const scores = {};
    safeFruits.forEach(f => {
        scores[f] = scoreFruit(FRUITS[f], signals, user.goal);
    });

    const low = safeFruits.filter(f => FRUITS[f].tier === "low");
    const mid = safeFruits.filter(f => FRUITS[f].tier !== "high"); // Low + Mid
    const high = safeFruits; // All

    const saladLow = buildBestSalad(low, scores, 4, 5);
    const saladMid = buildBestSalad(mid, scores, 5, 6);
    const saladHigh = buildBestSalad(high, scores, 5, 6);

    const juiceLow = buildBestSalad(low, scores, 2, 3);
    const juiceMid = buildBestSalad(mid, scores, 2, 3);
    const juiceHigh = buildBestSalad(high, scores, 3, 4);

    return {
        metrics: signals,
        results: {
            salads: {
                low: { ...saladLow, id: 1001, title: "Essential Fuel Bowl", desc: "Optimized for core hydration and fiber with maximum cost-efficiency.", price: 54 },
                mid: { ...saladMid, id: 1002, title: "Balanced Vitality Mix", desc: "Enhanced spectrum of nutrients balancing low-GI energy and antioxidants.", price: 65 },
                high: { ...saladHigh, id: 1003, title: "Performance Elite Bowl", desc: "Full-spectrum antioxidant load with premium metabolic boosters.", price: 89 }
            },
            juices: {
                low: { ...juiceLow, id: 2001, title: "Hydra-Flow Press", desc: "Rapid hydration delivery system using bio-available water-rich fruits.", price: 59 },
                mid: { ...juiceMid, id: 2002, title: "Active Recovery Nectar", desc: "enzyme-rich blend designed for digestive ease and metabolic waking.", price: 69 },
                high: { ...juiceHigh, id: 2003, title: "Cellular Renew Elixir", desc: "Concentrated antioxidant serum for maximum cellular protection.", price: 89 }
            }
        }
    };
}
