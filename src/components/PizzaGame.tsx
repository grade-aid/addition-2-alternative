import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowRight, RotateCcw, CheckCircle } from 'lucide-react';
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

// Keep the exact same PizzaScene class for visuals
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
    this.camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 8, 6);
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

interface GameState {
  currentDay: number;
  currentOrderIndex: number;
  selectedIngredients: string[];
  day1Earnings: number;
  day2Earnings: number;
  day1Attempts: number;
  day2Attempts: number;
  timeRemaining: number;
  isTimerActive: boolean;
  customerMood: '😊' | '😐' | '😠';
  gameStarted: boolean;
  gameCompleted: boolean;
  showOrderComplete: boolean;
  priceMultiplier: number;
}

export const PizzaGame: React.FC<PizzaGameProps> = ({ onComplete, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<PizzaScene | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simplified state management - single game state object
  const [gameState, setGameState] = useState<GameState>({
    currentDay: 1,
    currentOrderIndex: 0,
    selectedIngredients: [],
    day1Earnings: 0,
    day2Earnings: 0,
    day1Attempts: 0,
    day2Attempts: 0,
    timeRemaining: 15,
    isTimerActive: false,
    customerMood: '😊',
    gameStarted: false,
    gameCompleted: false,
    showOrderComplete: false,
    priceMultiplier: 1
  });

  // Generate orders once
  const [orders] = useState<PizzaOrder[]>(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const numIngredients = Math.floor(Math.random() * 4) + 2; // 2-5 ingredients
      const shuffled = [...INGREDIENTS].sort(() => 0.5 - Math.random());
      const selectedIngredients = shuffled.slice(0, numIngredients);
      
      return {
        id: i + 1,
        ingredients: selectedIngredients.map(ing => ing.id),
        totalPrice: selectedIngredients.reduce((sum, ing) => sum + ing.price, 0) + 5 // Base pizza price $5
      };
    });
  });

  // Initialize scene
  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;
    
    console.log('🍕 Initializing new pizza game session');
    sceneRef.current = new PizzaScene(canvasRef.current);
    
    // Load price multiplier
    const gameCount = parseInt(localStorage.getItem('pizzaGameCount') || '0', 10);
    setGameState(prev => ({ ...prev, priceMultiplier: gameCount + 1 }));

    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  // Update 3D ingredients when selection changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateIngredients(gameState.selectedIngredients);
    }
  }, [gameState.selectedIngredients]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && sceneRef.current) {
        const { clientWidth, clientHeight } = canvasRef.current;
        sceneRef.current.handleResize(clientWidth, clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Timer management
  useEffect(() => {
    if (gameState.isTimerActive && gameState.timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setGameState(prev => {
          const newTime = prev.timeRemaining - 1;
          
          // Update customer mood
          let mood: '😊' | '😐' | '😠' = '😊';
          if (newTime <= 5) mood = '😠';
          else if (newTime <= 10) mood = '😐';
          
          if (newTime <= 0) {
            // Timer expired - handle failed order
            console.log(`⏰ Timer expired on Day ${prev.currentDay}`);
            return handleOrderFailure(prev);
          }
          
          return { ...prev, timeRemaining: newTime, customerMood: mood };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState.isTimerActive, gameState.timeRemaining]);

  // Start timer when new order begins
  useEffect(() => {
    if (gameState.gameStarted && getCurrentOrder()) {
      console.log(`🎯 Starting timer for Day ${gameState.currentDay}, Order ${getCurrentOrder()?.id}`);
      setGameState(prev => ({
        ...prev,
        timeRemaining: 15,
        isTimerActive: true,
        customerMood: '😊'
      }));
    }
  }, [gameState.currentOrderIndex, gameState.currentDay, gameState.gameStarted]);

  const getCurrentOrder = () => orders[gameState.currentOrderIndex];

  const handleOrderFailure = (prevState: GameState): GameState => {
    const newAttempts = prevState.currentDay === 1 
      ? prevState.day1Attempts + 1 
      : prevState.day2Attempts + 1;

    console.log(`❌ Order failed on Day ${prevState.currentDay}, attempts: ${newAttempts}`);

    return {
      ...prevState,
      day1Attempts: prevState.currentDay === 1 ? newAttempts : prevState.day1Attempts,
      day2Attempts: prevState.currentDay === 2 ? newAttempts : prevState.day2Attempts,
      timeRemaining: 0,
      isTimerActive: false,
      selectedIngredients: [],
      ...getNextOrderState(prevState.currentDay, newAttempts, prevState.currentOrderIndex)
    };
  };

  const getNextOrderState = (currentDay: number, attempts: number, currentIndex: number) => {
    if (currentDay === 1 && attempts >= 5) {
      console.log('📅 Day 1 complete, starting Day 2');
      return {
        currentDay: 2,
        currentOrderIndex: 5 // Day 2 starts at index 5
      };
    } else if (currentDay === 2 && attempts >= 5) {
      console.log('🎉 Game completed!');
      return {
        gameCompleted: true,
        isTimerActive: false
      };
    } else {
      // Continue to next order in current day
      const nextIndex = currentDay === 1 
        ? (currentIndex + 1) % 5  // Day 1: orders 0-4
        : 5 + ((currentIndex - 5 + 1) % 5); // Day 2: orders 5-9
      
      return {
        currentOrderIndex: nextIndex
      };
    }
  };

  const startGame = () => {
    console.log('🎮 Starting pizza game');
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      currentDay: 1,
      currentOrderIndex: 0,
      selectedIngredients: [],
      timeRemaining: 15,
      isTimerActive: false // Will be activated by useEffect
    }));
  };

  const toggleIngredient = (ingredientId: string) => {
    setGameState(prev => ({
      ...prev,
      selectedIngredients: prev.selectedIngredients.includes(ingredientId)
        ? prev.selectedIngredients.filter(id => id !== ingredientId)
        : [...prev.selectedIngredients, ingredientId]
    }));
  };

  const resetPizza = () => {
    setGameState(prev => ({ ...prev, selectedIngredients: [] }));
  };

  const servePizza = () => {
    const currentOrder = getCurrentOrder();
    if (!currentOrder) return;

    const isCorrect = 
      gameState.selectedIngredients.length === currentOrder.ingredients.length &&
      gameState.selectedIngredients.every(id => currentOrder.ingredients.includes(id));

    console.log(`🍕 Serving pizza: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

    if (isCorrect) {
      const earnings = Math.round(currentOrder.totalPrice * gameState.priceMultiplier);
      
      setGameState(prev => {
        const newAttempts = prev.currentDay === 1 
          ? prev.day1Attempts + 1 
          : prev.day2Attempts + 1;

        const newEarnings = prev.currentDay === 1
          ? prev.day1Earnings + earnings
          : prev.day2Earnings + earnings;

        const updatedState = {
          ...prev,
          day1Attempts: prev.currentDay === 1 ? newAttempts : prev.day1Attempts,
          day2Attempts: prev.currentDay === 2 ? newAttempts : prev.day2Attempts,
          day1Earnings: prev.currentDay === 1 ? newEarnings : prev.day1Earnings,
          day2Earnings: prev.currentDay === 2 ? newEarnings : prev.day2Earnings,
          showOrderComplete: true,
          isTimerActive: false,
          selectedIngredients: []
        };

        return {
          ...updatedState,
          ...getNextOrderState(prev.currentDay, newAttempts, prev.currentOrderIndex)
        };
      });

      setTimeout(() => {
        setGameState(prev => ({ ...prev, showOrderComplete: false }));
      }, 2000);
    } else {
      // Incorrect order - treat as failure
      setGameState(prev => handleOrderFailure(prev));
    }
  };

  // Handle game completion
  useEffect(() => {
    if (gameState.gameCompleted) {
      console.log('🏆 Game completed with earnings:', gameState.day1Earnings, gameState.day2Earnings);
      
      setTimeout(() => {
        // Save incremented game count
        const currentGameCount = parseInt(localStorage.getItem('pizzaGameCount') || '0', 10);
        localStorage.setItem('pizzaGameCount', (currentGameCount + 1).toString());
        
        onComplete(gameState.day1Earnings, gameState.day2Earnings);
      }, 2000);
    }
  }, [gameState.gameCompleted, gameState.day1Earnings, gameState.day2Earnings, onComplete]);

  const currentOrder = getCurrentOrder();
  const currentDayAttempts = gameState.currentDay === 1 ? gameState.day1Attempts : gameState.day2Attempts;

  if (gameState.gameCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-4">Pizza Master!</h2>
          <p className="text-lg mb-4">You completed both days!</p>
          <div className="space-y-2 mb-6">
            <p>Day 1 Earnings: ${gameState.day1Earnings}</p>
            <p>Day 2 Earnings: ${gameState.day2Earnings}</p>
            <p className="font-bold">Total: ${gameState.day1Earnings + gameState.day2Earnings}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">🍕 Pizza Making Game</h2>
          <Button variant="outline" onClick={onClose} size="sm">✕</Button>
        </div>

        {!gameState.gameStarted ? (
          <div className="text-center py-8">
            <h3 className="text-xl mb-4">Welcome to Pizza Paradise!</h3>
            <p className="mb-6">Make pizzas for customers across 2 days. Match their orders exactly!</p>
            <Button onClick={startGame} size="lg">Start Game</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* 3D Pizza View */}
            <div className="space-y-4">
              <canvas
                ref={canvasRef}
                className="w-full h-64 border rounded-lg bg-sky-200"
                width="400"
                height="300"
              />
              
              {/* Game Status */}
              <Card className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">Day {gameState.currentDay}</span>
                  <span>Attempts: {currentDayAttempts}/5</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Customer: {gameState.customerMood}</span>
                  <span className="font-mono">
                    Time: {gameState.timeRemaining}s
                  </span>
                </div>
                <div className="text-sm">
                  <span>Day 1: ${gameState.day1Earnings}</span> | 
                  <span> Day 2: ${gameState.day2Earnings}</span>
                </div>
              </Card>
            </div>

            {/* Game Controls */}
            <div className="space-y-4">
              {/* Current Order */}
              {currentOrder && (
                <Card className="p-4">
                  <h4 className="font-bold mb-2">Order #{currentOrder.id}</h4>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {currentOrder.ingredients.map(ingredientId => {
                        const ingredient = INGREDIENTS.find(ing => ing.id === ingredientId);
                        return ingredient ? (
                          <span key={ingredientId} className="px-2 py-1 bg-blue-100 rounded text-sm">
                            {ingredient.emoji} {ingredient.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                    <p className="text-sm">
                      Value: ${Math.round(currentOrder.totalPrice * gameState.priceMultiplier)} 
                      (×{gameState.priceMultiplier})
                    </p>
                  </div>
                </Card>
              )}

              {/* Ingredients Selection */}
              <Card className="p-4">
                <h4 className="font-bold mb-3">Available Ingredients</h4>
                <div className="grid grid-cols-2 gap-2">
                  {INGREDIENTS.map(ingredient => (
                    <button
                      key={ingredient.id}
                      onClick={() => toggleIngredient(ingredient.id)}
                      className={`p-2 text-sm border rounded transition-colors ${
                        gameState.selectedIngredients.includes(ingredient.id)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      {ingredient.emoji} {ingredient.name}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={servePizza} 
                  disabled={!gameState.isTimerActive}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Serve Pizza
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetPizza}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Order Complete Popup */}
        {gameState.showOrderComplete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-xl font-bold mb-2">Perfect!</h3>
              <p>Order completed successfully!</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
