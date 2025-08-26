import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
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

// Pizza Plate Component
function PizzaPlate() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <cylinderGeometry args={[5, 5, 0.1, 32]} />
      <meshPhongMaterial color="#8B4513" />
    </mesh>
  );
}

// Pizza Base Component
function PizzaBase() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <cylinderGeometry args={[4, 4, 0.2, 32]} />
      <meshPhongMaterial color="#D4A574" />
      {/* Crust edge - slightly raised rim */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[4, 3.8, 0.1, 32]} />
        <meshPhongMaterial color="#C19660" />
      </mesh>
    </mesh>
  );
}

// Ingredient Components
function Sauce() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <cylinderGeometry args={[3.5, 3.5, 0.02, 32]} />
      <meshPhongMaterial color="#C73E1A" />
    </mesh>
  );
}

function Cheese() {
  const positions = Array.from({ length: 18 }, () => ({
    x: (Math.random() - 0.5) * 7,
    z: (Math.random() - 0.5) * 7,
    rotation: Math.random() * Math.PI * 2
  })).filter(pos => Math.sqrt(pos.x * pos.x + pos.z * pos.z) < 3.5);

  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={[pos.x, 0.04, pos.z]} rotation={[0, pos.rotation, 0]}>
          <boxGeometry args={[0.8, 0.1, 0.6]} />
          <meshPhongMaterial color="#FFF8DC" />
        </mesh>
      ))}
    </>
  );
}

function Pepperoni() {
  const positions = Array.from({ length: 10 }, () => ({
    x: (Math.random() - 0.5) * 7,
    z: (Math.random() - 0.5) * 7,
    rotation: Math.random() * Math.PI * 2
  })).filter(pos => Math.sqrt(pos.x * pos.x + pos.z * pos.z) < 3.5);

  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={[pos.x, 0.06, pos.z]} rotation={[0, pos.rotation, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.05, 16]} />
          <meshPhongMaterial color="#B22222" />
        </mesh>
      ))}
    </>
  );
}

function Mushrooms() {
  const positions = Array.from({ length: 8 }, () => ({
    x: (Math.random() - 0.5) * 7,
    z: (Math.random() - 0.5) * 7,
    rotation: Math.random() * Math.PI * 2
  })).filter(pos => Math.sqrt(pos.x * pos.x + pos.z * pos.z) < 3.5);

  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={[pos.x, 0.06, pos.z]} rotation={[0, pos.rotation, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.3]} />
          <meshPhongMaterial color="#D2B48C" />
        </mesh>
      ))}
    </>
  );
}

function Peppers() {
  const positions = Array.from({ length: 10 }, () => ({
    x: (Math.random() - 0.5) * 7,
    z: (Math.random() - 0.5) * 7,
    rotation: Math.random() * Math.PI * 2
  })).filter(pos => Math.sqrt(pos.x * pos.x + pos.z * pos.z) < 3.5);

  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={[pos.x, 0.06, pos.z]} rotation={[0, pos.rotation, 0]}>
          <boxGeometry args={[0.8, 0.06, 0.2]} />
          <meshPhongMaterial color={Math.random() > 0.5 ? "#228B22" : "#DC143C"} />
        </mesh>
      ))}
    </>
  );
}

function Olives() {
  const positions = Array.from({ length: 8 }, () => ({
    x: (Math.random() - 0.5) * 7,
    z: (Math.random() - 0.5) * 7,
    rotation: Math.random() * Math.PI * 2
  })).filter(pos => Math.sqrt(pos.x * pos.x + pos.z * pos.z) < 3.5);

  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={[pos.x, 0.06, pos.z]} rotation={[0, pos.rotation, 0]}>
          <torusGeometry args={[0.25, 0.1, 8, 16]} />
          <meshPhongMaterial color="#2F2F2F" />
        </mesh>
      ))}
    </>
  );
}

function Sausage() {
  const positions = Array.from({ length: 14 }, () => ({
    x: (Math.random() - 0.5) * 7,
    z: (Math.random() - 0.5) * 7,
    rotation: Math.random() * Math.PI * 2,
    scale: 0.2 + Math.random() * 0.2
  })).filter(pos => Math.sqrt(pos.x * pos.x + pos.z * pos.z) < 3.5);

  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={[pos.x, 0.06, pos.z]} rotation={[0, pos.rotation, 0]} scale={pos.scale}>
          <dodecahedronGeometry args={[0.4]} />
          <meshPhongMaterial color="#8B4513" />
        </mesh>
      ))}
    </>
  );
}

function Onions() {
  const positions = Array.from({ length: 8 }, () => ({
    x: (Math.random() - 0.5) * 7,
    z: (Math.random() - 0.5) * 7,
    rotation: Math.random() * Math.PI * 2
  })).filter(pos => Math.sqrt(pos.x * pos.x + pos.z * pos.z) < 3.5);

  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={[pos.x, 0.06, pos.z]} rotation={[0, pos.rotation, 0]}>
          <boxGeometry args={[0.7, 0.03, 0.15]} />
          <meshPhongMaterial color="#9370DB" transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  );
}

// Rotating Pizza Container
function RotatingPizza({ selectedIngredients }: { selectedIngredients: string[] }) {
  const pizzaRef = useRef<THREE.Group>();

  useFrame(() => {
    if (pizzaRef.current) {
      pizzaRef.current.rotation.y += 0.008; // Slow rotation
    }
  });

  const renderIngredient = (ingredientId: string) => {
    switch (ingredientId) {
      case 'sauce': return <Sauce key="sauce" />;
      case 'cheese': return <Cheese key="cheese" />;
      case 'pepperoni': return <Pepperoni key="pepperoni" />;
      case 'mushroom': return <Mushrooms key="mushrooms" />;
      case 'pepper': return <Peppers key="peppers" />;
      case 'olive': return <Olives key="olives" />;
      case 'sausage': return <Sausage key="sausage" />;
      case 'onion': return <Onions key="onions" />;
      default: return null;
    }
  };

  return (
    <group ref={pizzaRef}>
      <PizzaPlate />
      <PizzaBase />
      {selectedIngredients.map(renderIngredient)}
    </group>
  );
}

interface PizzaGameProps {
  onComplete: (day1Earnings: number, day2Earnings: number) => void;
  onClose: () => void;
}

export const PizzaGame: React.FC<PizzaGameProps> = ({ onComplete, onClose }) => {
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
            <Canvas camera={{ position: [5, 8, 5], fov: 50 }}>
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
              <RotatingPizza selectedIngredients={selectedIngredients} />
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
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