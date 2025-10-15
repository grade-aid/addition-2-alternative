import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowRight, RotateCcw, CheckCircle, Zap } from 'lucide-react';
import * as THREE from 'three';

interface Ingredient {
  id: string;
  name: string;
  price: number;
  emoji: string;
  color: string;
  shape: 'sauce' | 'cheese' | 'pepperoni' | 'mushroom' | 'pepper' | 'olive' | 'sausage' | 'onion';
}

interface PizzaOrder {
  id: number;
  ingredients: string[];
  totalPrice: number;
}

const INGREDIENTS: Ingredient[] = [
  { id: 'sauce', name: 'Tomato Sauce', price: 1, emoji: '🍅', color: '#C73E1A', shape: 'sauce' },
  { id: 'cheese', name: 'Mozzarella', price: 2, emoji: '🧀', color: '#FFF8DC', shape: 'cheese' },
  { id: 'pepperoni', name: 'Pepperoni', price: 3, emoji: '🍕', color: '#B22222', shape: 'pepperoni' },
  { id: 'mushroom', name: 'Mushrooms', price: 2, emoji: '🍄', color: '#D2B48C', shape: 'mushroom' },
  { id: 'pepper', name: 'Bell Peppers', price: 2, emoji: '🫑', color: '#228B22', shape: 'pepper' },
  { id: 'olive', name: 'Black Olives', price: 2, emoji: '🫒', color: '#2F2F2F', shape: 'olive' },
  { id: 'sausage', name: 'Italian Sausage', price: 3, emoji: '🌭', color: '#8B4513', shape: 'sausage' },
  { id: 'onion', name: 'Red Onions', price: 1, emoji: '🧅', color: '#9370DB', shape: 'onion' }
];

class PizzaScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private pizzaGroup: THREE.Group;
  private ingredientMeshes: Map<string, THREE.Mesh[]> = new Map();
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 12, 8);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // Create pizza group
    this.pizzaGroup = new THREE.Group();
    this.scene.add(this.pizzaGroup);
    
    // Create pizza base components
    this.createPizzaBase();
    
    // Start animation loop
    this.animate();
  }

  private createPizzaBase() {
    // Main pizza base (flat bottom part) - now full size without plate
    const baseGeometry = new THREE.CylinderGeometry(3.2, 3.2, 0.15, 32);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xE8A317, // Golden pizza base color
      shininess: 3
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.075;
    base.castShadow = true;
    base.receiveShadow = true;
    this.pizzaGroup.add(base);
    
    // Create puffy crust ring around the edge - scaled up
    const crustRingGeometry = new THREE.TorusGeometry(2.9, 0.35, 16, 32);
    const crustMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xD2691E, // Rich golden-brown crust color
      shininess: 5
    });
    const crustRing = new THREE.Mesh(crustRingGeometry, crustMaterial);
    crustRing.position.y = 0.2;
    crustRing.rotation.x = Math.PI / 2;
    crustRing.castShadow = true;
    crustRing.receiveShadow = true;
    this.pizzaGroup.add(crustRing);
    
    // Pizza surface (where ingredients go) - scaled up
    const surfaceGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.05, 32);
    const surfaceMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xF5C842, // Bright golden surface like in reference
      shininess: 2
    });
    const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    surface.position.y = 0.175;
    surface.receiveShadow = true;
    this.pizzaGroup.add(surface);
  }

  private generateRandomPositions(count: number, maxRadius: number = 2.3) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * maxRadius;
      positions.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        rotation: Math.random() * Math.PI * 2
      });
    }
    return positions;
  }

  private createSauce() {
    const sauceGeometry = new THREE.CylinderGeometry(2.4, 2.4, 0.03, 32);
    const sauceMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xC73E1A,
      shininess: 10 
    });
    const sauce = new THREE.Mesh(sauceGeometry, sauceMaterial);
    sauce.position.y = 0.205; // On top of pizza surface
    sauce.castShadow = true;
    return [sauce];
  }

  private createCheese() {
    const positions = this.generateRandomPositions(18);
    const cheeseMeshes = [];
    
    for (const pos of positions) {
      const cheeseGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.6);
      const cheeseMaterial = new THREE.MeshPhongMaterial({ color: 0xFFF8DC });
      const cheese = new THREE.Mesh(cheeseGeometry, cheeseMaterial);
      cheese.position.set(pos.x, 0.235, pos.z); // On top of sauce
      cheese.rotation.y = pos.rotation;
      cheese.castShadow = true;
      cheeseMeshes.push(cheese);
    }
    
    return cheeseMeshes;
  }

  private createPepperoni() {
    const positions = this.generateRandomPositions(10);
    const pepperoniMeshes = [];
    
    for (const pos of positions) {
      const pepperoniGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.03, 16);
      const pepperoniMaterial = new THREE.MeshPhongMaterial({ color: 0xB22222 });
      const pepperoni = new THREE.Mesh(pepperoniGeometry, pepperoniMaterial);
      pepperoni.position.set(pos.x, 0.265, pos.z); // On top of cheese
      pepperoni.rotation.y = pos.rotation;
      pepperoni.castShadow = true;
      pepperoniMeshes.push(pepperoni);
    }
    
    return pepperoniMeshes;
  }

  private createMushrooms() {
    const positions = this.generateRandomPositions(8);
    const mushroomMeshes = [];
    
    for (const pos of positions) {
      const mushroomGeometry = new THREE.BoxGeometry(0.5, 0.08, 0.3);
      const mushroomMaterial = new THREE.MeshPhongMaterial({ color: 0xD2B48C });
      const mushroom = new THREE.Mesh(mushroomGeometry, mushroomMaterial);
      mushroom.position.set(pos.x, 0.265, pos.z);
      mushroom.rotation.y = pos.rotation;
      mushroom.castShadow = true;
      mushroomMeshes.push(mushroom);
    }
    
    return mushroomMeshes;
  }

  private createPeppers() {
    const positions = this.generateRandomPositions(10);
    const pepperMeshes = [];
    
    for (const pos of positions) {
      const pepperGeometry = new THREE.BoxGeometry(0.8, 0.06, 0.2);
      const color = Math.random() > 0.5 ? 0x228B22 : 0xDC143C;
      const pepperMaterial = new THREE.MeshPhongMaterial({ color });
      const pepper = new THREE.Mesh(pepperGeometry, pepperMaterial);
      pepper.position.set(pos.x, 0.265, pos.z);
      pepper.rotation.y = pos.rotation;
      pepper.castShadow = true;
      pepperMeshes.push(pepper);
    }
    
    return pepperMeshes;
  }

  private createOlives() {
    const positions = this.generateRandomPositions(8);
    const oliveMeshes = [];
    
    for (const pos of positions) {
      const oliveGeometry = new THREE.TorusGeometry(0.2, 0.08, 8, 16);
      const oliveMaterial = new THREE.MeshPhongMaterial({ color: 0x2F2F2F });
      const olive = new THREE.Mesh(oliveGeometry, oliveMaterial);
      olive.position.set(pos.x, 0.265, pos.z);
      olive.rotation.x = Math.PI / 2;
      olive.rotation.z = pos.rotation;
      olive.castShadow = true;
      oliveMeshes.push(olive);
    }
    
    return oliveMeshes;
  }

  private createSausage() {
    const positions = this.generateRandomPositions(14);
    const sausageMeshes = [];
    
    for (const pos of positions) {
      const sausageGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const sausageMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
      const sausage = new THREE.Mesh(sausageGeometry, sausageMaterial);
      const scale = 0.15 + Math.random() * 0.15;
      sausage.position.set(pos.x, 0.265, pos.z);
      sausage.scale.setScalar(scale);
      sausage.castShadow = true;
      sausageMeshes.push(sausage);
    }
    
    return sausageMeshes;
  }

  private createOnions() {
    const positions = this.generateRandomPositions(8);
    const onionMeshes = [];
    
    for (const pos of positions) {
      const onionGeometry = new THREE.BoxGeometry(0.7, 0.03, 0.15);
      const onionMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x9370DB, 
        transparent: true, 
        opacity: 0.8 
      });
      const onion = new THREE.Mesh(onionGeometry, onionMaterial);
      onion.position.set(pos.x, 0.265, pos.z);
      onion.rotation.y = pos.rotation;
      onion.castShadow = true;
      onionMeshes.push(onion);
    }
    
    return onionMeshes;
  }

  public updateIngredients(selectedIngredients: string[]) {
    // Clear existing ingredient meshes
    this.ingredientMeshes.forEach((meshes) => {
      meshes.forEach(mesh => this.pizzaGroup.remove(mesh));
    });
    this.ingredientMeshes.clear();
    
    // Add selected ingredients
    selectedIngredients.forEach(ingredientId => {
      let meshes: THREE.Mesh[] = [];
      
      switch (ingredientId) {
        case 'sauce':
          meshes = this.createSauce();
          break;
        case 'cheese':
          meshes = this.createCheese();
          break;
        case 'pepperoni':
          meshes = this.createPepperoni();
          break;
        case 'mushroom':
          meshes = this.createMushrooms();
          break;
        case 'pepper':
          meshes = this.createPeppers();
          break;
        case 'olive':
          meshes = this.createOlives();
          break;
        case 'sausage':
          meshes = this.createSausage();
          break;
        case 'onion':
          meshes = this.createOnions();
          break;
      }
      
      if (meshes.length > 0) {
        this.ingredientMeshes.set(ingredientId, meshes);
        meshes.forEach(mesh => this.pizzaGroup.add(mesh));
      }
    });
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    
    // Slow rotation of the pizza
    this.pizzaGroup.rotation.y += 0.008;
    
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer.dispose();
  }
}

interface PizzaGameProps {
  onComplete: (day1Earnings: number, day2Earnings: number) => void;
  onClose: () => void;
}

export const PizzaGame: React.FC<PizzaGameProps> = ({ onComplete, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<PizzaScene | null>(null);
  
  // Game start state
  const [gameStarted, setGameStarted] = useState(false);
  
  const [currentDay, setCurrentDay] = useState(1);
  const [pizzasSoldDay1, setPizzasSoldDay1] = useState(0);
  const [pizzasSoldDay2, setPizzasSoldDay2] = useState(0);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [day1Earnings, setDay1Earnings] = useState(0);
  const [day2Earnings, setDay2Earnings] = useState(0);
  const [showOrderComplete, setShowOrderComplete] = useState(false);
  
  // Order attempt tracking
  const [day1Attempts, setDay1Attempts] = useState(0);
  const [day2Attempts, setDay2Attempts] = useState(0);
  const [day1Failed, setDay1Failed] = useState(0);
  const [day2Failed, setDay2Failed] = useState(0);
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(20);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [orderFailed, setOrderFailed] = useState(false);
  
  // Visual feedback states
  const [customerMood, setCustomerMood] = useState<'😊' | '😐' | '😠'>('😊');
  
  // Price multiplier system - session-based cycling through [1, 4, 8]
  const [sessionGameCount, setSessionGameCount] = useState(0);
  const [priceMultiplier, setPriceMultiplier] = useState(1);

  // Generate random orders for each day
  const [orders] = useState<PizzaOrder[]>(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const numIngredients = Math.floor(Math.random() * 4) + 2; // 2-5 ingredients
      const shuffled = [...INGREDIENTS].sort(() => 0.5 - Math.random());
      const selectedIngredients = shuffled.slice(0, numIngredients);
      
      return {
        id: i + 1,
        ingredients: selectedIngredients.map(ing => ing.id),
        totalPrice: (selectedIngredients.reduce((sum, ing) => sum + ing.price, 0) + 5) // Base pizza price $5
      };
    });
  });

  const currentOrder = orders[currentOrderIndex];
  const totalPizzasToday = currentDay === 1 ? pizzasSoldDay1 : pizzasSoldDay2;
  const totalAttemptsToday = currentDay === 1 ? day1Attempts : day2Attempts;

  // Timer effect - Fixed dependencies to include currentDay
  useEffect(() => {
    console.log('Timer effect triggered:', { isTimerActive, timeLeft, currentDay });
    if (isTimerActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          // Update customer mood based on time (adjusted for 20 seconds)
          if (newTime > 15) setCustomerMood('😊');
          else if (newTime > 8) setCustomerMood('😐');
          else setCustomerMood('😠');
          
          if (newTime <= 0) {
            // Order failed - clear timer and move to next pizza
            setIsTimerActive(false);
            setOrderFailed(true);
            setTimeout(() => {
              setOrderFailed(false);
              // Track failed order
              if (currentDay === 1) {
                setDay1Failed(prev => prev + 1);
                setDay1Attempts(prev => prev + 1);
              } else {
                setDay2Failed(prev => prev + 1);
                setDay2Attempts(prev => prev + 1);
              }
              nextOrder();
            }, 2000);
            return 0; // Ensure we return 0 to stop the timer
          }
          
          return newTime;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isTimerActive, currentDay]); // Added currentDay to dependencies

  // Start timer when new order appears - Enhanced with debug logging
  useEffect(() => {
    console.log('Order change effect:', { currentOrder: currentOrder?.id, gameStarted, currentDay, currentOrderIndex, totalOrders: orders.length });
    if (currentOrder && gameStarted) {
      console.log('Starting timer for Day', currentDay, 'Order', currentOrder.id);
      setTimeLeft(20);
      setIsTimerActive(true);
      setCustomerMood('😊');
    } else if (!currentOrder && gameStarted && currentDay === 2) {
      // Fallback: if we're on Day 2 and don't have a current order, complete the game
      console.log('No current order on Day 2, completing game (fallback)');
      // Cycle price multiplier for next game session
      const nextCount = sessionGameCount + 1;
      const multipliers = [1, 4, 8];
      setPriceMultiplier(multipliers[nextCount % 3]);
      setSessionGameCount(nextCount);
      console.log('Calling onComplete with earnings (order fallback):', { day1Earnings, day2Earnings });
      onComplete(day1Earnings, day2Earnings);
    }
  }, [currentOrderIndex, gameStarted, currentDay, currentOrder, orders.length, day1Earnings, day2Earnings, onComplete]);

  const nextOrder = () => {
    console.log('nextOrder called:', { currentDay, totalAttemptsToday, day1Attempts, day2Attempts, currentOrderIndex });
    
    // Check if day is complete (5 total attempts)
    if (totalAttemptsToday >= 5) {
      if (currentDay === 1) {
        console.log('Day 1 complete, transitioning to Day 2');
        setCurrentDay(2);
        setCurrentOrderIndex(5);
        setSelectedIngredients([]);
        // Explicit timer reset for Day 2
        setTimeLeft(20);
        setIsTimerActive(false); // Will be reactivated by the order change effect
      } else {
        // Game completed - immediately call onComplete
        console.log('Day 2 complete, finishing game');
        // Cycle price multiplier for next game session
        const nextCount = sessionGameCount + 1;
        const multipliers = [1, 4, 8];
        setPriceMultiplier(multipliers[nextCount % 3]);
        setSessionGameCount(nextCount);
        console.log('Calling onComplete with earnings:', { day1Earnings, day2Earnings });
        onComplete(day1Earnings, day2Earnings);
        return; // Exit early to prevent further execution
      }
    } else {
      // Check bounds to prevent going beyond available orders
      const nextIndex = currentOrderIndex + 1;
      if (nextIndex >= orders.length) {
        console.log('No more orders available, completing game');
        // Cycle price multiplier for next game session
        const nextCount = sessionGameCount + 1;
        const multipliers = [1, 4, 8];
        setPriceMultiplier(multipliers[nextCount % 3]);
        setSessionGameCount(nextCount);
        console.log('Calling onComplete with earnings (fallback):', { day1Earnings, day2Earnings });
        onComplete(day1Earnings, day2Earnings);
        return;
      }
      
      console.log('Moving to next order:', nextIndex);
      setCurrentOrderIndex(nextIndex);
      setSelectedIngredients([]);
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) {
      // Wait for next frame to ensure proper sizing
      setTimeout(() => {
        if (canvasRef.current) {
          sceneRef.current = new PizzaScene(canvasRef.current);
          // Initial sizing
          const rect = canvasRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            sceneRef.current.handleResize(rect.width, rect.height);
          }
        }
      }, 0);
    }
    
    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  // Update ingredients when selection changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateIngredients(selectedIngredients);
    }
  }, [selectedIngredients]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && sceneRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          sceneRef.current.handleResize(rect.width, rect.height);
        }
      }
    };
    
    // Use ResizeObserver for better container resize detection
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }
    
    // Also listen to window resize as fallback
    window.addEventListener('resize', handleResize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredientId) 
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const servePizza = () => {
    if (!currentOrder || !isTimerActive) return;

    // Check if pizza matches the order
    const orderMatches = currentOrder.ingredients.every(ing => selectedIngredients.includes(ing)) &&
                        selectedIngredients.every(ing => currentOrder.ingredients.includes(ing));

    if (orderMatches) {
      setIsTimerActive(false);
      
      // Calculate bonus for time remaining and apply price multiplier
      const timeBonus = Math.floor(timeLeft / 2) * priceMultiplier;
      const basePrice = currentOrder.totalPrice * priceMultiplier;
      const totalEarnings = basePrice + timeBonus;
      
      if (currentDay === 1) {
        setPizzasSoldDay1(prev => prev + 1);
        setDay1Earnings(prev => prev + totalEarnings);
        setDay1Attempts(prev => prev + 1);
      } else {
        setPizzasSoldDay2(prev => prev + 1);  
        setDay2Earnings(prev => prev + totalEarnings);
        setDay2Attempts(prev => prev + 1);
      }

      setShowOrderComplete(true);
      setTimeout(() => {
        setShowOrderComplete(false);
        nextOrder();
      }, 1500);
    }
  };

  const resetPizza = () => {
    setSelectedIngredients([]);
  };

  const completePizza = () => {
    if (currentOrder) {
      setSelectedIngredients([...currentOrder.ingredients]);
    }
  };

  const startGame = () => {
    setGameStarted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-6xl p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-4xl">{currentDay === 1 ? '☀️' : '🌙'}</div>
            <h1 className="font-display text-4xl font-bold text-brand-black">
              🍕 Day {currentDay}
            </h1>
            <div className="text-4xl">{customerMood}</div>
          </div>
          
          {/* Price Multiplier Indicator */}
          {priceMultiplier > 1 && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full mb-4 animate-pulse">
              <span className="text-2xl">🔥</span>
              <span className="font-bold text-lg">{priceMultiplier}x PRICES!</span>
              <span className="text-2xl">💰</span>
            </div>
          )}
          
          <div className="flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">☀️</span>
              <div className="flex gap-1">
                {Array.from({length: 5}, (_, i) => {
                  let color = 'bg-gray-300'; // Pending
                  if (i < pizzasSoldDay1) {
                    color = 'bg-green-500'; // Success
                  } else if (i < day1Attempts) {
                    color = 'bg-red-500'; // Failed
                  }
                  return (
                    <div key={i} className={`w-3 h-3 rounded-full ${color}`} />
                  );
                })}
              </div>
              <span className="text-lg font-bold">${day1Earnings}</span>
              {day1Failed > 0 && (
                <span className="text-sm text-red-600">(-{day1Failed})</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌙</span>
              <div className="flex gap-1">
                {Array.from({length: 5}, (_, i) => {
                  let color = 'bg-gray-300'; // Pending
                  if (i < pizzasSoldDay2) {
                    color = 'bg-green-500'; // Success
                  } else if (i < day2Attempts) {
                    color = 'bg-red-500'; // Failed
                  }
                  return (
                    <div key={i} className={`w-3 h-3 rounded-full ${color}`} />
                  );
                })}
              </div>
              <span className="text-lg font-bold">${day2Earnings}</span>
              {day2Failed > 0 && (
                <span className="text-sm text-red-600">(-{day2Failed})</span>
              )}
            </div>
          </div>
        </div>

        {showOrderComplete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-3xl text-center animate-scale-in">
              <div className="text-6xl mb-4">✅</div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                +${(currentOrder?.totalPrice || 0) * priceMultiplier + Math.floor(timeLeft / 2) * priceMultiplier}
              </div>
              <div className="text-lg text-gray-600">⚡ Speed Bonus: +${Math.floor(timeLeft / 2) * priceMultiplier}</div>
            </div>
          </div>
        )}

        {orderFailed && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-3xl text-center animate-scale-in">
              <div className="text-6xl mb-4">❌</div>
              <div className="text-2xl font-bold text-red-600">Time's Up!</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 3D Pizza Viewer with Timer */}
          <div className="bg-gradient-to-b from-blue-100 to-blue-200 rounded-3xl p-4 relative h-96 lg:h-[500px]">
            {/* Timer Ring */}
            <div className="absolute top-8 left-8 z-10">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={timeLeft > 6 ? '#10b981' : timeLeft > 3 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(timeLeft / 20) * 283} 283`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${timeLeft <= 5 ? 'animate-pulse text-red-600' : 'text-gray-700'}`}>
                    {timeLeft}
                  </span>
                </div>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              className="w-full h-full rounded-xl"
              style={{ display: 'block', minHeight: '300px' }}
            />
          </div>

          {/* Game Controls */}
          <div className="space-y-6">
            {!gameStarted ? (
              /* Start Game Interface */
              <div className="text-center space-y-6">
                <div className="text-6xl mb-4">🍕</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Pizza Restaurant Challenge
                </h2>
                <p className="text-gray-600 mb-6">
                  Ready to start your pizza restaurant? Make exact pizzas within 20 seconds!
                </p>
                
                <Button
                  onClick={startGame}
                  className="px-8 py-4 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <span className="text-2xl mr-2">🚀</span>
                  Start Game
                </Button>
              </div>
            ) : (
              /* Game Controls */
              <>
                {/* Current Order */}
                {currentOrder && (
                  <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">📋</div>
                      <div className="text-2xl">{customerMood}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {currentOrder.ingredients.map(ingredientId => {
                        const ingredient = INGREDIENTS.find(ing => ing.id === ingredientId);
                        const isSelected = selectedIngredients.includes(ingredientId);
                        return ingredient ? (
                          <div key={ingredientId} className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                            isSelected ? 'bg-green-100 border-2 border-green-400 scale-105' : 'bg-white border border-gray-200'
                          }`}>
                            <span className="text-2xl">{ingredient.emoji}</span>
                            <div className="flex-1">
                              {isSelected && <span className="text-green-600 text-lg">✓</span>}
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-green-600">
                        ${currentOrder.totalPrice * priceMultiplier}
                        {priceMultiplier > 1 && (
                          <span className="text-sm text-orange-600 ml-1">({priceMultiplier}x)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">+ Speed Bonus</div>
                    </div>
                  </Card>
                )}

                {/* Ingredient Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🧑‍🍳</span>
                    <div className="text-xl font-bold">Ingredients</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {INGREDIENTS.map(ingredient => {
                      const isSelected = selectedIngredients.includes(ingredient.id);
                      const isRequired = currentOrder?.ingredients.includes(ingredient.id);
                      
                      return (
                        <Button
                          key={ingredient.id}
                          onClick={() => toggleIngredient(ingredient.id)}
                          variant={isSelected ? "default" : "outline"}
                          className={`flex items-center justify-center gap-2 p-4 h-auto transition-all duration-200 ${
                            isSelected ? 'scale-105 shadow-lg' : 'hover:scale-102'
                          }`}
                          style={{
                            backgroundColor: isSelected ? ingredient.color : undefined
                          }}
                        >
                          <span className="text-3xl">{ingredient.emoji}</span>
                          <div className="text-center">
                            <div className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>
                              ${ingredient.price * priceMultiplier}
                              {priceMultiplier > 1 && (
                                <span className="text-xs opacity-75 block">({priceMultiplier}x)</span>
                              )}
                            </div>
                            {isSelected && <div className="text-white text-lg">✓</div>}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button 
                    onClick={servePizza} 
                    disabled={!isTimerActive}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <span className="text-2xl mr-2">🍕</span>
                    SERVE
                  </Button>
                  <Button 
                    onClick={completePizza}
                    variant="outline"
                    className="w-16 h-16 rounded-full bg-blue-100 hover:bg-blue-200 border-blue-300"
                  >
                    <Zap className="w-6 h-6 text-blue-600" />
                  </Button>
                  <Button 
                    onClick={resetPizza} 
                    variant="outline"
                    className="w-16 h-16 rounded-full bg-red-100 hover:bg-red-200 border-red-300"
                  >
                    <RotateCcw className="w-6 h-6 text-red-600" />
                  </Button>
                </div>
              </>
            )}

          </div>
        </div>
      </Card>
    </div>
  );
};