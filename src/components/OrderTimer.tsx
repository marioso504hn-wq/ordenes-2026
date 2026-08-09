import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { OrderStatus } from '../types';

interface OrderTimerProps {
  createdAt: number;
  status: OrderStatus;
  updatedAt?: number;
  dueDate?: number;
}

export const OrderTimer: React.FC<OrderTimerProps> = ({ createdAt, status, updatedAt, dueDate }) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (status === 'completed' || status === 'delivered' || status === 'finalizada') return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const isCompleted = status === 'completed' || status === 'delivered' || status === 'finalizada';

  // If a due date is set, calculate remaining time until due date
  if (dueDate && !isCompleted) {
    const isOverdue = now >= dueDate;
    const diffMs = Math.abs(dueDate - now);
    const totalSec = Math.floor(diffMs / 1000);

    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    let timeString = '';
    if (days > 0) {
      timeString = `${days}d ${hours}h ${minutes}m`;
    } else {
      timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    let colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    let Icon = Clock;
    let badgeText = `Vence en ${timeString}`;

    if (isOverdue) {
      colorClass = 'bg-rose-600 text-white border-rose-700 animate-pulse shadow-xs font-bold';
      Icon = AlertTriangle;
      badgeText = `¡VENCIDA! (Hace ${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m)`;
    } else if (days === 0 && hours < 24) {
      colorClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      Icon = AlertCircle;
      badgeText = `Vence Hoy: ${timeString}`;
    }

    return (
      <div
        title={`Fecha de entrega: ${new Date(dueDate).toLocaleString('es-NI')}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${colorClass}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{badgeText}</span>
      </div>
    );
  }

  // Fallback: Elapsed time since creation
  const endTime = isCompleted && updatedAt ? updatedAt : now;
  const elapsedMs = Math.max(0, endTime - createdAt);
  const totalSeconds = Math.floor(elapsedMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = days > 0
    ? `${days}d ${hours}h ${minutes}m`
    : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  let colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  let Icon = Clock;

  if (isCompleted) {
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = CheckCircle2;
  }

  return (
    <div
      title="Tiempo transcurrido desde la creación"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${colorClass}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{formattedTime}</span>
    </div>
  );
};

