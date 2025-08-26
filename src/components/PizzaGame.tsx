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
    // Pizza plate (ceramic-looking plate)
    const plateGeometry = new THREE.CylinderGeometry(3.2, 3.2, 0.15, 32);
    const plateMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xF5F5DC, // Beige ceramic color
      shininess: 20
    });
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.position.y = -0.075;
    plate.receiveShadow = true;
    this.pizzaGroup.add(plate);
    
    // Main pizza base with integrated thick crust edge
    const baseGeometry = new THREE.CylinderGeometry(1.5, 2.4, 0.35, 32);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xD2691E, // Rich golden-brown crust color
      shininess: 5
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.175;
    base.castShadow = true;
    base.receiveShadow = true;
    this.pizzaGroup.add(base);
    
    // Pizza surface (flat top for ingredients) - slightly recessed
    const surfaceGeometry = new THREE.CylinderGeometry(1.4, 1.4, 0.02, 32);
    const surfaceMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xF2D062, // Slightly lighter surface
      shininess: 2
    });
    const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    surface.position.y = 0.36;
    surface.receiveShadow = true;
    this.pizzaGroup.add(surface);
  }

  private generateRandomPositions(count: number, maxRadius: number = 1.2) {
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
    const sauceGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.02, 32);
    const sauceMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xC73E1A,
      shininess: 10 
    });
    const sauce = new THREE.Mesh(sauceGeometry, sauceMaterial);
    sauce.position.y = 0.37; // On top of pizza surface
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
      cheese.position.set(pos.x, 0.39, pos.z); // On top of sauce
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
      pepperoni.position.set(pos.x, 0.42, pos.z); // On top of cheese
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
      mushroom.position.set(pos.x, 0.42, pos.z);
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
      pepper.position.set(pos.x, 0.42, pos.z);
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
      olive.position.set(pos.x, 0.42, pos.z);
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
      sausage.position.set(pos.x, 0.42, pos.z);
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
      onion.position.set(pos.x, 0.42, pos.z);
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
  
  const [currentDay, setCurrentDay] = useState(1);
  const [pizzasSoldDay1, setPizzasSoldDay1] = useState(0);
  const [pizzasSoldDay2, setPizzasSoldDay2] = useState(0);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [day1Earnings, setDay1Earnings] = useState(0);
  const [day2Earnings, setDay2Earnings] = useState(0);
  const [showOrderComplete, setShowOrderComplete] = useState(false);

  // Generate random orders for each day
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

  const currentOrder = orders[currentOrderIndex];
  const totalPizzasToday = currentDay === 1 ? pizzasSoldDay1 : pizzasSoldDay2;

  // Initialize Three.js scene
  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) {
      sceneRef.current = new PizzaScene(canvasRef.current);
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
        sceneRef.current.handleResize(rect.width, rect.height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredientId) 
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const servePizza = () => {
    if (!currentOrder) return;

    // Check if pizza matches the order
    const orderMatches = currentOrder.ingredients.every(ing => selectedIngredients.includes(ing)) &&
                        selectedIngredients.every(ing => currentOrder.ingredients.includes(ing));

    if (orderMatches) {
      if (currentDay === 1) {
        setPizzasSoldDay1(prev => prev + 1);
        setDay1Earnings(prev => prev + currentOrder.totalPrice);
      } else {
        setPizzasSoldDay2(prev => prev + 1);  
        setDay2Earnings(prev => prev + currentOrder.totalPrice);
      }

      setShowOrderComplete(true);
      setTimeout(() => {
        setShowOrderComplete(false);
        
        if (totalPizzasToday >= 4) { // 5 pizzas total (this will be the 5th)
          if (currentDay === 1) {
            setCurrentDay(2);
            setCurrentOrderIndex(5); // Start day 2 orders
            setSelectedIngredients([]);
          } else {
            // Game complete
            onComplete(day1Earnings + currentOrder.totalPrice, day2Earnings + currentOrder.totalPrice);
          }
        } else {
          setCurrentOrderIndex(prev => prev + 1);
          setSelectedIngredients([]);
        }
      }, 1500);
    }
  };

  const resetPizza = () => {
    setSelectedIngredients([]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-6xl p-8">
        <div className="text-center mb-6">
          <h1 className="font-display text-4xl font-bold text-brand-black mb-2">
            🍕 Pizza Restaurant - Day {currentDay}
          </h1>
          <p className="text-xl text-muted-foreground">
            Serve 5 pizzas each day to earn money!
          </p>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-lg">
              <span className="font-bold">Day 1:</span> {pizzasSoldDay1}/5 pizzas - ${day1Earnings}
            </div>
            <div className="text-lg">
              <span className="font-bold">Day 2:</span> {pizzasSoldDay2}/5 pizzas - ${day2Earnings}
            </div>
          </div>
        </div>

        {showOrderComplete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-3xl text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600">Order Complete!</h2>
              <p className="text-lg">+${currentOrder?.totalPrice}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 3D Pizza Viewer */}
          <div className="bg-gradient-to-b from-blue-100 to-blue-200 rounded-3xl p-4">
            <canvas 
              ref={canvasRef}
              className="w-full h-full rounded-xl"
              style={{ display: 'block' }}
            />
          </div>

          {/* Game Controls */}
          <div className="space-y-6">
            {/* Current Order */}
            {currentOrder && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <h3 className="text-xl font-bold mb-3">Order #{currentOrder.id - (currentDay === 2 ? 5 : 0)}</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {currentOrder.ingredients.map(ingredientId => {
                    const ingredient = INGREDIENTS.find(ing => ing.id === ingredientId);
                    return ingredient ? (
                      <div key={ingredientId} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                        <span className="text-xl">{ingredient.emoji}</span>
                        <span className="text-sm">{ingredient.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
                <p className="text-lg font-bold text-green-600">Total: ${currentOrder.totalPrice}</p>
              </Card>
            )}

            {/* Ingredient Selection */}
            <div>
              <h3 className="text-xl font-bold mb-4">Select Ingredients:</h3>
              <div className="grid grid-cols-2 gap-3">
                {INGREDIENTS.map(ingredient => (
                  <Button
                    key={ingredient.id}
                    onClick={() => toggleIngredient(ingredient.id)}
                    variant={selectedIngredients.includes(ingredient.id) ? "default" : "outline"}
                    className="flex items-center gap-2 p-3 h-auto"
                  >
                    <span className="text-xl">{ingredient.emoji}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium">{ingredient.name}</div>
                      <div className="text-xs text-muted-foreground">${ingredient.price}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={servePizza} className="flex-1 grade-button accent">
                Serve Pizza 🍕
              </Button>
              <Button onClick={resetPizza} variant="outline">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            <Button onClick={onClose} variant="outline" className="w-full">
              Skip Game
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};