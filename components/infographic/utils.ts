import { 
    TrendingUp, Zap, Users, Target, BarChart, DollarSign, Rocket, Lightbulb, CheckCircle, AlertTriangle, FileText, Info,
    Quote, Shield, Star, Award, Gift, Heart, ThumbsUp, XCircle, Check
} from 'lucide-react';
import React from 'react';

export const getIcon = (iconName: string) => {
  const icons: Record<string, React.ElementType> = {
    TrendingUp, Zap, Users, Target, BarChart, DollarSign, Rocket, Lightbulb, CheckCircle, AlertTriangle, FileText, Info,
    Quote, Shield, Star, Award, Gift, Heart, ThumbsUp, XCircle, Check
  };
  const IconComponent = icons[iconName] || Info;
  return IconComponent;
};
