import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Clock, Leaf, BarChart3, Plus, Minus, ArrowLeft, LogOut, TrendingUp, Flame, Scale } from 'lucide-react';
import { 
  auth, 
  signUpUser, 
  loginUser, 
  logoutUser,
  addHabit,
  getHabits,
  updateHabit,
  deleteHabit,
  addMeal,
  getMeals,
  addExpense,
  getExpenses,
  addBurned,
  getBurned,
  addWeight,
  getWeights,
  deleteWeight,
  deleteAllUserData
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const FOOD_DATA = [
  { name: "Chicken Breast (Cooked)", unit: "g", protein: 31, carbs: 0, fats: 3.6, calories: 165 },
  { name: "Chicken Breast (Raw)", unit: "g", protein: 23, carbs: 0, fats: 1.2, calories: 110 },
  { name: "Rice (White, Cooked)", unit: "g", protein: 2.7, carbs: 28, fats: 0.3, calories: 130 },
  { name: "Egg (Whole)", unit: "qty", protein: 6.3, carbs: 0.4, fats: 5, calories: 72 },
  { name: "Egg Whites", unit: "qty", protein: 3.6, carbs: 0.2, fats: 0, calories: 17 },
  { name: "Whey Protein (Scoop)", unit: "qty", protein: 24, carbs: 3, fats: 1, calories: 117 },
  { name: "Milk (Whole)", unit: "ml", protein: 3.2, carbs: 4.8, fats: 3.3, calories: 61 },
  { name: "Oats (Raw)", unit: "g", protein: 11.8, carbs: 68.5, fats: 9.5, calories: 407 },
  { name: "Banana", unit: "qty", protein: 1.3, carbs: 27, fats: 0.4, calories: 105 },
  { name: "Apple", unit: "qty", protein: 0.5, carbs: 25, fats: 0.3, calories: 95 },
  { name: "Peanut Butter", unit: "g", protein: 25, carbs: 20, fats: 50, calories: 588 },
  { name: "Bread (Slice)", unit: "qty", protein: 3, carbs: 15, fats: 1, calories: 80 }
];

const DEFAULT_HABITS = ["Drink 3L Water", "Gym Workout", "Read 10 Pages", "No Sugar", "Sleep 8 Hours", "10k Steps", "Take Creatine", "Meditation"];

const getDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Toast Notification Component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? '#39EF7B' : type === 'error' ? '#ff4444' : '#ffd93d';
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: bgColor,
      color: type === 'success' ? '#000' : '#fff',
      padding: '15px 25px',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      zIndex: 10000,
      animation: 'slideIn 0.3s ease-out',
      fontWeight: 600,
      fontSize: '0.9rem'
    }}>
      {message}
    </div>
  );
};

// Streak Badge Component
const StreakBadge = ({ streak }) => {
  if (streak < 3) return null;
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
      padding: '4px 10px',
      borderRadius: '15px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      color: '#fff',
      animation: 'pulse 2s infinite'
    }}>
      <Flame size={14} />
      {streak} day streak!
    </div>
  );
};

export default function DailyTracker() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [toast, setToast] = useState(null);

  const [view, setView] = useState('landing');
  const [animationDirection, setAnimationDirection] = useState('fade');
  const [date, setDate] = useState(new Date());
  const [habits, setHabits] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [burned, setBurned] = useState([]);
  const [weights, setWeights] = useState([]);
  const [timing, setTiming] = useState('');
  const [name, setName] = useState('');
  const [items, setItems] = useState([{ name: '', weight: '' }]);
  const [breakdown, setBreakdown] = useState([]);
  const [totals, setTotals] = useState({ protein: 0, carbs: 0, fats: 0, calories: 0 });
  const [expItem, setExpItem] = useState('');
  const [expAmt, setExpAmt] = useState('');
  const [expDet, setExpDet] = useState('');
  const [burnAct, setBurnAct] = useState('');
  const [burnCal, setBurnCal] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const canvasRef = useRef(null);
  const weightCanvasRef = useRef(null);

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes slideInLeft {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      .view-container-left {
        animation: slideInLeft 0.5s ease-out;
      }
      .view-container-center {
        animation: fadeIn 0.5s ease-out;
      }
      .view-container-right {
        animation: slideInRight 0.5s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const navigateToView = (targetView, direction = 'fade') => {
    setAnimationDirection(direction);
    setView(targetView);
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load user data when user logs in
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Load habits
      const habitsData = await getHabits(user.uid);
      if (habitsData.length === 0) {
        const defaultHabits = DEFAULT_HABITS.map((name, i) => ({
          name,
          completedDates: []
        }));
        
        for (const habit of defaultHabits) {
          await addHabit(user.uid, habit);
        }
        
        const newHabits = await getHabits(user.uid);
        setHabits(newHabits);
      } else {
        setHabits(habitsData);
      }

      // Load meals
      const mealsData = await getMeals(user.uid);
      setMeals(mealsData);

      // Load expenses
      const expensesData = await getExpenses(user.uid);
      setExpenses(expensesData);

      // Load burned
      const burnedData = await getBurned(user.uid);
      setBurned(burnedData);

      // Load weights
      const weightsData = await getWeights(user.uid);
      setWeights(weightsData);
    } catch (error) {
      console.error('Error loading user data:', error);
      showToast('Error loading data', 'error');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    const result = authMode === 'login' 
      ? await loginUser(email, password) 
      : await signUpUser(email, password);
    
    if (!result.success) {
      setAuthError(result.error);
    } else {
      setEmail('');
      setPassword('');
      showToast(authMode === 'login' ? 'Welcome back!' : 'Account created!');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setHabits([]);
    setMeals([]);
    setExpenses([]);
    setBurned([]);
    setWeights([]);
    navigateToView('landing', 'fade');
    showToast('Logged out successfully');
  };

  const toggle = async (habitId, dateKey) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const dates = habit.completedDates || [];
    const newDates = dates.includes(dateKey) 
      ? dates.filter(x => x !== dateKey) 
      : [...dates, dateKey];

    await updateHabit(habitId, { completedDates: newDates });
    
    setHabits(prev => prev.map(h => 
      h.id === habitId ? { ...h, completedDates: newDates } : h
    ));
  };

  const calculateStreak = (habit) => {
    const dates = habit.completedDates || [];
    if (dates.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    
    while (true) {
      const dateKey = getDateKey(currentDate);
      if (dates.includes(dateKey)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const addH = async () => {
    const habitName = prompt('Habit name:');
    if (habitName && user) {
      const result = await addHabit(user.uid, {
        name: habitName,
        completedDates: []
      });
      
      if (result.success) {
        setHabits(prev => [...prev, {
          id: result.id,
          name: habitName,
          completedDates: []
        }]);
        showToast('Habit added!');
      }
    }
  };

  const delH = async (habitId) => {
    if (window.confirm('Delete this habit?')) {
      await deleteHabit(habitId);
      setHabits(prev => prev.filter(h => h.id !== habitId));
      showToast('Habit deleted', 'error');
    }
  };

  const addRow = () => {
    if (items.length < 5) setItems([...items, { name: '', weight: '' }]);
  };

  const remRow = () => {
    if (items.length > 1) setItems(items.slice(0, -1));
  };

  const upd = (i, f, v) => {
    const n = [...items];
    n[i][f] = v;
    setItems(n);
  };

  const calc = () => {
    let t = { protein: 0, carbs: 0, fats: 0, calories: 0 };
    const b = [];
    items.forEach(it => {
      const f = FOOD_DATA.find(x => x.name.toLowerCase() === it.name.toLowerCase());
      const w = parseFloat(it.weight) || 0;
      if (f && w > 0) {
        const r = f.unit === 'qty' ? w : w / 100;
        t.protein += f.protein * r;
        t.carbs += f.carbs * r;
        t.fats += f.fats * r;
        t.calories += f.calories * r;
        b.push({ name: f.name, weight: w, unit: f.unit, calories: Math.round(f.calories * r) });
      }
    });
    setTotals(t);
    setBreakdown(b);
  };

  const save = async () => {
    if (!timing || !name || !user) return showToast('Missing info', 'error');
    
    const its = [];
    let mt = { protein: 0, carbs: 0, fats: 0, calories: 0 };
    
    items.forEach(it => {
      const f = FOOD_DATA.find(x => x.name.toLowerCase() === it.name.toLowerCase());
      const w = parseFloat(it.weight) || 0;
      if (f && w > 0) {
        const r = f.unit === 'qty' ? w : w / 100;
        mt.protein += f.protein * r;
        mt.carbs += f.carbs * r;
        mt.fats += f.fats * r;
        mt.calories += f.calories * r;
        its.push({ name: f.name, weight: w, unit: f.unit });
      }
    });
    
    if (its.length === 0) return showToast('Add food items', 'error');
    
    const mealData = {
      date: new Date().toISOString(),
      category: timing,
      name,
      items: its,
      totalMacros: mt
    };
    
    const result = await addMeal(user.uid, mealData);
    
    if (result.success) {
      setMeals(prev => [{ id: result.id, ...mealData }, ...prev]);
      reset();
      showToast('Meal saved!');
    }
  };

  const reset = () => {
    setTiming('');
    setName('');
    setItems([{ name: '', weight: '' }]);
    setBreakdown([]);
    setTotals({ protein: 0, carbs: 0, fats: 0, calories: 0 });
  };

  const addExp = async () => {
    if (expItem && expAmt && user) {
      const expenseData = {
        date: new Date().toISOString(),
        name: expItem,
        amount: parseFloat(expAmt),
        details: expDet
      };
      
      const result = await addExpense(user.uid, expenseData);
      
      if (result.success) {
        setExpenses(prev => [{ id: result.id, ...expenseData }, ...prev]);
        setExpItem('');
        setExpAmt('');
        setExpDet('');
        showToast('Expense added');
      }
    }
  };

  const addBrn = async () => {
    if (burnAct && burnCal && user) {
      const burnedData = {
        date: new Date().toISOString(),
        activity: burnAct,
        calories: parseFloat(burnCal)
      };
      
      const result = await addBurned(user.uid, burnedData);
      
      if (result.success) {
        setBurned(prev => [{ id: result.id, ...burnedData }, ...prev]);
        setBurnAct('');
        setBurnCal('');
        showToast('Activity added');
      }
    }
  };

  const addWt = async () => {
    if (currentWeight && user) {
      const weightData = {
        date: new Date().toISOString(),
        weight: parseFloat(currentWeight)
      };
      
      const result = await addWeight(user.uid, weightData);
      
      if (result.success) {
        setWeights(prev => [...prev, { id: result.id, ...weightData }].sort((a, b) => new Date(a.date) - new Date(b.date)));
        setCurrentWeight('');
        showToast('Weight logged!');
      }
    }
  };

  const resetAll = async () => {
    if (window.confirm('Reset all data? This cannot be undone!') && user) {
      const result = await deleteAllUserData(user.uid);
      
      if (result.success) {
        const defaultHabits = DEFAULT_HABITS.map((name) => ({
          name,
          completedDates: []
        }));
        
        for (const habit of defaultHabits) {
          await addHabit(user.uid, habit);
        }
        
        await loadUserData();
        showToast('All data reset!', 'error');
      }
    }
  };

  const today = getDateKey(new Date());
  
  const todayTot = meals.reduce((a, m) => {
    if (m.date.startsWith(today) && m.totalMacros) {
      a.calories += m.totalMacros.calories || 0;
      a.protein += m.totalMacros.protein || 0;
      a.carbs += m.totalMacros.carbs || 0;
      a.fats += m.totalMacros.fats || 0;
    }
    return a;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const todayBrn = burned.reduce((s, b) => b.date.startsWith(today) ? s + (b.calories || 0) : s, 0);
  const todayExp = expenses.reduce((s, e) => e.date.startsWith(today) ? s + (e.amount || 0) : s, 0);

  const getSummaries = () => {
    const sum = {};
    meals.forEach(m => {
      if (!m.totalMacros) return;
      const k = m.date.substring(0, 10);
      if (!sum[k]) sum[k] = { calories: 0, protein: 0, carbs: 0, fats: 0, burned: 0 };
      sum[k].calories += m.totalMacros.calories || 0;
      sum[k].protein += m.totalMacros.protein || 0;
      sum[k].carbs += m.totalMacros.carbs || 0;
      sum[k].fats += m.totalMacros.fats || 0;
    });
    burned.forEach(b => {
      const k = b.date.substring(0, 10);
      if (!sum[k]) sum[k] = { calories: 0, protein: 0, carbs: 0, fats: 0, burned: 0 };
      sum[k].burned += b.calories || 0;
    });
    Object.keys(sum).forEach(k => {
      const c = habits.filter(h => (h.completedDates || []).includes(k)).length;
      sum[k].habitPercent = habits.length > 0 ? Math.round((c / habits.length) * 100) : 0;
    });
    return Object.entries(sum).sort((a, b) => b[0].localeCompare(a[0]));
  };

  useEffect(() => {
    if (view === 'lifestyle' && canvasRef.current) draw();
  }, [view, date, habits]);

  useEffect(() => {
    if (view === 'weight' && weightCanvasRef.current && weights.length > 0) drawWeightChart();
  }, [view, weights]);

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const r = c.parentElement.getBoundingClientRect();
    c.width = r.width;
    c.height = r.height;
    const y = date.getFullYear();
    const m = date.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    const cnt = new Array(days).fill(0);
    habits.forEach(h => {
      const dates = h.completedDates || [];
      for (let d = 1; d <= days; d++) {
        if (dates.includes(getDateKey(new Date(y, m, d)))) cnt[d - 1]++;
      }
    });
    ctx.clearRect(0, 0, c.width, c.height);
    if (habits.length === 0) return;
    const w = c.width, h = c.height, sx = w / (days - 1), tp = 20;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < days; i++) {
      const p = cnt[i] / habits.length, x = i * sx, y2 = h - (p * (h - tp));
      if (i === 0) ctx.lineTo(x, y2);
      else {
        const px = (i - 1) * sx, py = h - ((cnt[i - 1] / habits.length) * (h - tp));
        ctx.bezierCurveTo(px + (x - px) / 2, py, px + (x - px) / 2, y2, x, y2);
      }
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.4)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  };

  const drawWeightChart = () => {
    const c = weightCanvasRef.current;
    if (!c || weights.length === 0) return;
    
    const ctx = c.getContext('2d');
    const r = c.parentElement.getBoundingClientRect();
    c.width = r.width;
    c.height = r.height;
    
    const w = c.width, h = c.height;
    const padding = 40;
    const chartWidth = w - padding * 2;
    const chartHeight = h - padding * 2;
    
    const weightValues = weights.map(wt => wt.weight);
    const minWeight = Math.min(...weightValues) - 2;
    const maxWeight = Math.max(...weightValues) + 2;
    const weightRange = maxWeight - minWeight;
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
    }
    
    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#39EF7B';
    ctx.lineWidth = 3;
    
    weights.forEach((wt, i) => {
      const x = padding + (chartWidth / (weights.length - 1)) * i;
      const y = padding + chartHeight - ((wt.weight - minWeight) / weightRange) * chartHeight;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      
      // Draw points
      ctx.fillStyle = '#39EF7B';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw weight value
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${wt.weight}kg`, x, y - 15);
    });
    
    ctx.stroke();
  };

  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #000 0%, #111 100%)', color: '#fff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Segoe UI, sans-serif' }}>
        <div style={{ fontSize: '1.5rem' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #000 0%, #111 100%)', color: '#fff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 200, letterSpacing: '4px', marginBottom: '30px', textAlign: 'center', textTransform: 'uppercase' }}>DAILY TRACKER</h1>
          <form onSubmit={handleAuth}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', marginBottom: '15px', outline: 'none', fontSize: '1rem' }}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', marginBottom: '15px', outline: 'none', fontSize: '1rem' }}
            />
            {authError && <div style={{ color: '#ff4444', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>{authError}</div>}
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#39EF7B', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', marginBottom: '15px' }}>
              {authMode === 'login' ? 'LOGIN' : 'SIGN UP'}
            </button>
            <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
              {authMode === 'login' ? (
                <span>Don't have an account? <button type="button" onClick={() => setAuthMode('signup')} style={{ background: 'none', border: 'none', color: '#39EF7B', cursor: 'pointer', textDecoration: 'underline' }}>Sign Up</button></span>
              ) : (
                <span>Already have an account? <button type="button" onClick={() => setAuthMode('login')} style={{ background: 'none', border: 'none', color: '#39EF7B', cursor: 'pointer', textDecoration: 'underline' }}>Login</button></span>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <div className={`view-container-${animationDirection}`} style={{ background: 'linear-gradient(135deg, #000 0%, #111 100%)', color: '#fff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '900px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: 'clamp(0.8rem, 2vw, 1rem)', color: '#888' }}>{user.email}</div>
            <button onClick={handleLogout} style={{ background: 'rgba(255,75,43,0.1)', color: '#ff4b2b', border: '1px solid #ff4b2b', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)' }}>
              <LogOut size={14} /> Logout
            </button>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 3rem)', fontWeight: 200, letterSpacing: '4px', marginBottom: '50px', textTransform: 'uppercase' }}>DAILY TRACKER</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'clamp(15px, 3vw, 30px)' }}>
            <div onClick={() => navigateToView('lifestyle', 'left')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '30px', height: 'clamp(180px, 25vw, 250px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s', ':hover': { transform: 'translateY(-5px)' } }}>
              <Leaf size={Math.min(40, window.innerWidth / 12)} style={{ marginBottom: '15px' }} />
              <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', fontWeight: 600, letterSpacing: '2px' }}>LIFESTYLE</span>
              <span style={{ fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#888', marginTop: '5px' }}>Habit Matrix</span>
            </div>
            <div onClick={() => navigateToView('tracker', 'fade')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '30px', height: 'clamp(180px, 25vw, 250px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
              <BarChart3 size={Math.min(40, window.innerWidth / 12)} style={{ marginBottom: '15px' }} />
              <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', fontWeight: 600, letterSpacing: '2px' }}>TRACKER</span>
              <span style={{ fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#888', marginTop: '5px' }}>Daily Logs</span>
            </div>
            <div onClick={() => navigateToView('weight', 'right')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '30px', height: 'clamp(180px, 25vw, 250px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
              <Scale size={Math.min(40, window.innerWidth / 12)} style={{ marginBottom: '15px' }} />
              <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', fontWeight: 600, letterSpacing: '2px' }}>WEIGHT</span>
              <span style={{ fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#888', marginTop: '5px' }}>Track Progress</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'weight') {
    const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : 0;
    const firstWeight = weights.length > 0 ? weights[0].weight : 0;
    const weightChange = latestWeight - firstWeight;
    
    return (
      <div className={`view-container-${animationDirection}`} style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: 'clamp(10px, 3vw, 20px)', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI, sans-serif' }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => navigateToView('landing', 'fade')} style={{ background: 'rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            <div style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', fontWeight: 300, letterSpacing: '2px' }}>Weight Tracker</div>
          </div>
          <button onClick={() => navigateToView('stats', 'fade')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14} /> History</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: 'clamp(15px, 3vw, 20px)' }}>
            <h3 style={{ color: '#888', marginBottom: '15px', fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)', letterSpacing: '1px' }}>LOG WEIGHT</h3>
            <input 
              type="number" 
              step="0.1"
              value={currentWeight} 
              onChange={e => setCurrentWeight(e.target.value)} 
              placeholder="Weight (kg)" 
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', marginBottom: '10px', outline: 'none', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }} 
            />
            <button onClick={addWt} style={{ width: '100%', background: '#39EF7B', color: '#000', padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)', fontWeight: 'bold' }}>Add Weight</button>
          </div>
          
          <div style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: 'clamp(15px, 3vw, 20px)' }}>
            <h3 style={{ color: '#888', marginBottom: '15px', fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)', letterSpacing: '1px' }}>PROGRESS</h3>
            <div style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.75rem)', color: '#aaa', marginBottom: '8px' }}>Current: <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)' }}>{latestWeight}kg</span></div>
            <div style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.75rem)', color: '#aaa', marginBottom: '8px' }}>Change: <span style={{ color: weightChange >= 0 ? '#ff6b6b' : '#39EF7B', fontWeight: 'bold' }}>{weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)}kg</span></div>
            <div style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.75rem)', color: '#aaa' }}>Entries: <span style={{ color: '#fff', fontWeight: 'bold' }}>{weights.length}</span></div>
          </div>
        </div>
        
        {weights.length > 0 && (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #333', borderRadius: '12px', height: '300px', position: 'relative', marginBottom: '20px' }}>
            <div style={{ position: 'absolute', top: '10px', left: '15px', fontSize: 'clamp(0.6rem, 1.2vw, 0.7rem)', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Weight Progress</div>
            <canvas ref={weightCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        )}
        
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: 'clamp(10px, 2vw, 15px)', textAlign: 'left', fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: 'clamp(10px, 2vw, 15px)', textAlign: 'left', fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Weight</th>
                <th style={{ padding: 'clamp(10px, 2vw, 15px)', textAlign: 'left', fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {weights.length === 0 ? (
                <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#555' }}>No weight data</td></tr>
              ) : (
                weights.map((wt, idx) => {
                  const prevWeight = idx > 0 ? weights[idx - 1].weight : wt.weight;
                  const change = wt.weight - prevWeight;
                  return (
                    <tr key={wt.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.7rem, 1.4vw, 0.85rem)' }}>{formatDate(wt.date)}</td>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', fontWeight: 600 }}>{wt.weight}kg</td>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', color: idx === 0 ? '#888' : (change >= 0 ? '#ff6b6b' : '#39EF7B'), fontWeight: 600 }}>
                        {idx === 0 ? '-' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}kg`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (view === 'lifestyle') {
    const y = date.getFullYear(), m = date.getMonth(), days = new Date(y, m + 1, 0).getDate();
    
    return (
      <div className={`view-container-${animationDirection}`} style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: 'clamp(10px, 3vw, 20px)', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI, sans-serif' }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => navigateToView('landing', 'fade')} style={{ background: 'rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            <div style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', fontWeight: 300, letterSpacing: '2px' }}>Habit Matrix</div>
          </div>
          <button onClick={() => navigateToView('stats', 'fade')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14} /> History</button>
        </div>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
            <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}><ChevronLeft /></button>
            <div style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', fontWeight: 'bold' }}>{date.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
            <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}><ChevronRight /></button>
          </div>
          <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', flexGrow: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: '#111', zIndex: 15, width: 'clamp(120px, 18vw, 160px)', borderRight: '1px solid #333', padding: '8px 10px', fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)', color: '#ddd', fontWeight: 600, textAlign: 'left' }}>Habit</th>
                  {[...Array(days)].map((_, i) => (
                    <th key={i} style={{ position: 'sticky', top: 0, background: '#111', zIndex: 5, fontSize: 'clamp(0.6rem, 1.2vw, 0.7rem)', color: '#888', padding: '8px 0', borderBottom: '1px solid #333', width: 'clamp(25px, 3vw, 30px)' }}>{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map(h => {
                  const streak = calculateStreak(h);
                  return (
                    <tr key={h.id}>
                      <td style={{ position: 'sticky', left: 0, background: '#111', zIndex: 10, borderRight: '1px solid #333', padding: '8px 10px', fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)', color: '#ddd', fontWeight: 600 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div>
                            {h.name} <span onClick={() => delH(h.id)} style={{ cursor: 'pointer', color: '#555', fontSize: '14px', marginLeft: '5px' }}>×</span>
                          </div>
                          {streak >= 3 && <StreakBadge streak={streak} />}
                        </div>
                      </td>
                      {[...Array(days)].map((_, i) => {
                        const d = getDateKey(new Date(y, m, i + 1)), dates = h.completedDates || [], c = dates.includes(d), t = d === today;
                        return (
                          <td key={i} style={{ padding: '6px 0', borderRight: '1px solid #222', borderBottom: '1px solid #222', textAlign: 'center' }}>
                            <div onClick={() => toggle(h.id, d)} style={{ width: 'clamp(20px, 3vw, 24px)', height: 'clamp(20px, 3vw, 24px)', background: c ? (t ? '#39EF7B' : '#fff') : 'rgba(255,255,255,0.08)', borderRadius: '6px', margin: '0 auto', cursor: 'pointer', transition: 'all 0.2s', border: t && !c ? '2px solid #39EF7B' : (c ? 'none' : '1px solid rgba(255,255,255,0.2)'), boxShadow: c ? '0 0 8px rgba(255,255,255,0.4)' : t ? '0 0 5px rgba(57,239,123,0.2)' : 'none' }} />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ height: 'clamp(80px, 15vh, 120px)', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', borderRadius: '12px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', left: '15px', fontSize: 'clamp(0.6rem, 1.2vw, 0.7rem)', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Consistency</div>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
          <div style={{ textAlign: 'right', marginTop: '10px' }}>
            <button onClick={addH} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}>+ New Habit</button>
          </div>
        </div>
      </div>
    );
  }

// Continue with rest of the views (tracker, stats) - keeping original code but adding toast notifications
// Due to length limits, I'll keep the tracker and stats views the same but add className={`view-container-${animationDirection}`} and toast component

if (view === 'tracker') {
    return (
      <div className={`view-container-${animationDirection}`} style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: 'clamp(10px, 3vw, 20px)', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI, sans-serif' }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => navigateToView('landing', 'fade')} style={{ background: 'rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            <div style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', fontWeight: 300, letterSpacing: '2px' }}>Daily Logs</div>
          </div>
          <button onClick={() => navigateToView('stats', 'fade')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14} /> History</button>
        </div>
        <div style={{ flexGrow: 1, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1.5fr 1fr' : '1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: 'clamp(15px, 3vw, 20px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: '#888', marginBottom: '15px', fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)', letterSpacing: '1px' }}>MEAL ENTRY</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                  <select value={timing} onChange={e => setTiming(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}>
                    <option value="">Category</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snacks">Snacks</option>
                    <option value="dinner">Dinner</option>
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0 10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={remRow} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Minus size={16} /></button>
                    <span style={{ margin: '0 15px', fontWeight: 'bold' }}>{items.length}</span>
                    <button onClick={addRow} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Plus size={16} /></button>
                  </div>
                </div>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Meal Name" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', marginBottom: '15px', outline: 'none', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                  {items.map((it, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                      <input list="food-list" type="text" value={it.name} onChange={e => upd(i, 'name', e.target.value)} placeholder={`Item ${i + 1}`} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }} />
                      <input type="number" value={it.weight} onChange={e => upd(i, 'weight', e.target.value)} placeholder="Qty/g" style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }} />
                    </div>
                  ))}
                </div>
                <datalist id="food-list">{FOOD_DATA.map(f => <option key={f.name} value={f.name} />)}</datalist>
                <button onClick={reset} style={{ background: 'transparent', border: 'none', color: '#666', fontSize: 'clamp(0.7rem, 1.3vw, 0.75rem)', cursor: 'pointer', marginBottom: '10px' }}>Clear</button>
                {breakdown.length > 0 && (
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: '#888', marginBottom: '15px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                    {breakdown.map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <span>{it.name} ({it.weight}{it.unit})</span>
                        <span style={{ color: '#fff' }}>{it.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', textAlign: 'center', borderRadius: '10px', marginBottom: '10px' }}>
                  <div style={{ fontSize: 'clamp(0.6rem, 1.2vw, 0.7rem)', color: '#888', marginBottom: '5px' }}>TOTAL</div>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 'bold' }}>{Math.round(totals.calories)} kcal</div>
                  <div style={{ fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#aaa', marginTop: '5px' }}>P: {Math.round(totals.protein)}g · C: {Math.round(totals.carbs)}g · F: {Math.round(totals.fats)}g</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={calc} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)' }}>Calculate</button>
                  <button onClick={save} style={{ flex: 1, background: '#39EF7B', color: '#000', padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)', fontWeight: 'bold' }}>Save</button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: 'clamp(15px, 3vw, 20px)' }}>
                <h3 style={{ color: '#888', marginBottom: '15px', fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)', letterSpacing: '1px' }}>BURNED</h3>
                <input type="text" value={burnAct} onChange={e => setBurnAct(e.target.value)} placeholder="Activity" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', marginBottom: '10px', outline: 'none', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }} />
                <input type="number" value={burnCal} onChange={e => setBurnCal(e.target.value)} placeholder="Calories" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', marginBottom: '10px', outline: 'none', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }} />
                <button onClick={addBrn} style={{ width: '100%', background: '#39EF7B', color: '#000', padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)', fontWeight: 'bold' }}>Add</button>
              </div>
              <div style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: 'clamp(15px, 3vw, 20px)' }}>
                <h3 style={{ color: '#888', marginBottom: '15px', fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)', letterSpacing: '1px' }}>EXPENSE</h3>
                <input type="text" value={expItem} onChange={e => setExpItem(e.target.value)} placeholder="Item" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', marginBottom: '10px', outline: 'none', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }} />
                <input type="number" value={expAmt} onChange={e => setExpAmt(e.target.value)} placeholder="Amount" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', marginBottom: '10px', outline: 'none', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }} />
                <input type="text" value={expDet} onChange={e => setExpDet(e.target.value)} placeholder="Details" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', marginBottom: '10px', outline: 'none', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }} />
                <button onClick={addExp} style={{ width: '100%', background: '#39EF7B', color: '#000', padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)', fontWeight: 'bold' }}>Add</button>
              </div>
              <div style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: 'clamp(15px, 3vw, 20px)' }}>
                <h3 style={{ color: '#888', marginBottom: '15px', fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)', letterSpacing: '1px' }}>TODAY</h3>
                <div style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.75rem)', color: '#aaa', marginBottom: '8px' }}>Intake: <span style={{ color: '#fff', fontWeight: 'bold' }}>{Math.round(todayTot.calories)} kcal</span></div>
                <div style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.75rem)', color: '#aaa', marginBottom: '8px' }}>Burned: <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{todayBrn} kcal</span></div>
                <div style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.75rem)', color: '#aaa', marginBottom: '8px' }}>Net: <span style={{ color: '#39EF7B', fontWeight: 'bold' }}>{Math.round(todayTot.calories - todayBrn)} kcal</span></div>
                <div style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.75rem)', color: '#aaa', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>Expenses: <span style={{ color: '#ffd93d', fontWeight: 'bold' }}>₹{todayExp.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'stats') {
    const summaries = getSummaries();
    
    return (
      <div className={`view-container-${animationDirection}`} style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: 'clamp(20px, 4vw, 60px)', fontFamily: 'Segoe UI, sans-serif' }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
          <button onClick={() => navigateToView('landing', 'fade')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 'clamp(0.8rem, 1.8vw, 0.95rem)' }}><ArrowLeft size={18} /> Back</button>
          <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 300, letterSpacing: '4px', textTransform: 'uppercase' }}>History</h1>
          <button onClick={resetAll} style={{ background: 'none', border: '2px solid #ff4444', color: '#ff4444', padding: '8px 20px', borderRadius: '25px', cursor: 'pointer', fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)', fontWeight: 600 }}>Reset</button>
        </div>

        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', fontWeight: 600, marginBottom: '25px', borderLeft: '4px solid #fff', paddingLeft: '15px' }}>TODAY</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
            {[
              { label: 'Calories', value: Math.round(todayTot.calories), color: '#fff' },
              { label: 'Burned', value: todayBrn, color: '#ff6b6b' },
              { label: 'Protein', value: `${Math.round(todayTot.protein)}g`, color: '#a78bfa' },
              { label: 'Carbs', value: `${Math.round(todayTot.carbs)}g`, color: '#fff' },
              { label: 'Fats', value: `${Math.round(todayTot.fats)}g`, color: '#fff' }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: 'clamp(15px, 3vw, 25px)', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
                <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', fontWeight: 600, marginBottom: '25px', borderLeft: '4px solid #fff', paddingLeft: '15px' }}>DAILY SUMMARY</h2>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {['Date', 'Calories', 'Burned', 'Protein', 'Carbs', 'Fats', 'Habits'].map(h => (
                    <th key={h} style={{ padding: 'clamp(10px, 2vw, 15px)', textAlign: 'left', fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaries.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#555' }}>No data</td></tr>
                ) : (
                  summaries.map(([dt, data]) => (
                    <tr key={dt} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)' }}>{formatDate(dt)}</td>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', fontWeight: 600 }}>{Math.round(data.calories)}</td>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', color: '#ff6b6b', fontWeight: 600 }}>-{Math.round(data.burned)}</td>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', color: '#a78bfa' }}>{Math.round(data.protein)}g</td>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)' }}>{Math.round(data.carbs)}g</td>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', color: '#39EF7B' }}>{Math.round(data.fats)}g</td>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', color: '#39EF7B', fontWeight: 600 }}>{data.habitPercent}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', fontWeight: 600, marginBottom: '25px', borderLeft: '4px solid #fff', paddingLeft: '15px' }}>MEALS</h2>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {['Date', 'Category', 'Name', 'Items', 'Calories'].map(h => (
                    <th key={h} style={{ padding: 'clamp(10px, 2vw, 15px)', textAlign: 'left', fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meals.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#555' }}>No meals</td></tr>
                ) : (
                  meals.map(meal => (
                    <tr key={meal.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.7rem, 1.4vw, 0.85rem)' }}>{formatDate(meal.date)}</td>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)' }}><span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', textTransform: 'capitalize' }}>{meal.category}</span></td>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', fontWeight: 600 }}>{meal.name}</td>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.7rem, 1.4vw, 0.85rem)', color: '#999' }}>{(meal.items || []).map(it => `${it.name} (${it.weight}${it.unit})`).join(', ') || '-'}</td>
                      <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', fontWeight: 600 }}>{Math.round(meal.totalMacros?.calories || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', gap: '30px' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', fontWeight: 600, marginBottom: '25px', borderLeft: '4px solid #fff', paddingLeft: '15px' }}>ACTIVITY</h2>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {['Date', 'Activity', 'Kcal'].map(h => (
                      <th key={h} style={{ padding: 'clamp(10px, 2vw, 15px)', textAlign: 'left', fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {burned.length === 0 ? (
                    <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#555' }}>No activity</td></tr>
                  ) : (
                    burned.map(b => (
                      <tr key={b.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.7rem, 1.4vw, 0.85rem)' }}>{formatDate(b.date)}</td>
                        <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', fontWeight: 600 }}>{b.activity}</td>
                        <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', color: '#ff6b6b', fontWeight: 600 }}>-{b.calories}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', fontWeight: 600, marginBottom: '25px', borderLeft: '4px solid #fff', paddingLeft: '15px' }}>EXPENSES</h2>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {['Date', 'Item', 'Details', 'Cost'].map(h => (
                      <th key={h} style={{ padding: 'clamp(10px, 2vw, 15px)', textAlign: 'left', fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#555' }}>No expenses</td></tr>
                  ) : (
                    expenses.map(exp => (
                      <tr key={exp.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.7rem, 1.4vw, 0.85rem)' }}>{formatDate(exp.date)}</td>
                        <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', fontWeight: 600 }}>{exp.name}</td>
                        <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.7rem, 1.4vw, 0.85rem)', color: '#999' }}>{exp.details || '-'}</td>
                        <td style={{ padding: 'clamp(10px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', color: '#ffd93d', fontWeight: 600 }}>-₹{exp.amount.toFixed(0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}