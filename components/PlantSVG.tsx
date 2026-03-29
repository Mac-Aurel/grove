import React from 'react';
import Svg, { Circle, Rect, Polygon, Ellipse, G } from 'react-native-svg';
import { Colors } from '../constants/theme';

const LEAF = Colors.accent;
const LIGHT = Colors.heatmap2;
const BLOOM = Colors.heatmap1;
const STEM = Colors.muted;

interface PlantSVGProps {
  plantType: string;
  size?: number;
}

function Sprout(): React.JSX.Element {
  return (
    <G>
      <Rect x={28} y={44} width={4} height={36} rx={2} fill={STEM} />
      <Circle cx={30} cy={37} r={13} fill={LEAF} />
    </G>
  );
}

function Seedling(): React.JSX.Element {
  return (
    <G>
      <Rect x={28} y={40} width={4} height={40} rx={2} fill={STEM} />
      <Circle cx={30} cy={28} r={13} fill={LEAF} />
      <Ellipse cx={17} cy={43} rx={11} ry={6} fill={LIGHT} transform="rotate(-30, 17, 43)" />
      <Ellipse cx={43} cy={43} rx={11} ry={6} fill={LIGHT} transform="rotate(30, 43, 43)" />
    </G>
  );
}

function Herb(): React.JSX.Element {
  return (
    <G>
      <Rect x={28} y={32} width={4} height={48} rx={2} fill={STEM} />
      <Ellipse cx={16} cy={44} rx={13} ry={6} fill={LIGHT} transform="rotate(-40, 16, 44)" />
      <Ellipse cx={30} cy={22} rx={8} ry={15} fill={LEAF} />
      <Ellipse cx={44} cy={44} rx={13} ry={6} fill={LIGHT} transform="rotate(40, 44, 44)" />
    </G>
  );
}

function Bush(): React.JSX.Element {
  return (
    <G>
      <Rect x={26} y={52} width={8} height={28} rx={2} fill={STEM} />
      <Circle cx={21} cy={48} r={17} fill={LIGHT} />
      <Circle cx={39} cy={48} r={17} fill={LEAF} />
    </G>
  );
}

function SmallTree(): React.JSX.Element {
  return (
    <G>
      <Rect x={27} y={52} width={6} height={28} rx={2} fill={STEM} />
      <Polygon points="30,8 6,56 54,56" fill={LEAF} />
    </G>
  );
}

function Tree(): React.JSX.Element {
  return (
    <G>
      <Rect x={27} y={54} width={6} height={26} rx={2} fill={STEM} />
      <Polygon points="30,30 5,58 55,58" fill={LEAF} />
      <Polygon points="30,8 12,36 48,36" fill={LIGHT} />
    </G>
  );
}

function BloomingTree(): React.JSX.Element {
  return (
    <G>
      <Rect x={27} y={56} width={6} height={24} rx={2} fill={STEM} />
      <Polygon points="30,32 6,60 54,60" fill={LEAF} />
      <Circle cx={16} cy={28} r={10} fill={BLOOM} />
      <Circle cx={30} cy={14} r={12} fill={BLOOM} />
      <Circle cx={44} cy={28} r={10} fill={BLOOM} />
    </G>
  );
}

function AncientTree(): React.JSX.Element {
  return (
    <G>
      <Rect x={24} y={56} width={12} height={24} rx={3} fill={STEM} />
      <Circle cx={30} cy={48} r={18} fill={LEAF} />
      <Circle cx={14} cy={38} r={10} fill={LIGHT} />
      <Circle cx={46} cy={38} r={10} fill={LIGHT} />
      <Circle cx={30} cy={28} r={15} fill={LEAF} />
      <Circle cx={30} cy={13} r={10} fill={BLOOM} />
    </G>
  );
}

export function PlantSVG({ plantType, size = 60 }: PlantSVGProps): React.JSX.Element {
  const height = (size * 80) / 60;

  const shape = (): React.JSX.Element => {
    switch (plantType) {
      case 'sprout': return <Sprout />;
      case 'seedling': return <Seedling />;
      case 'herb': return <Herb />;
      case 'bush': return <Bush />;
      case 'small_tree': return <SmallTree />;
      case 'tree': return <Tree />;
      case 'blooming_tree': return <BloomingTree />;
      case 'ancient_tree': return <AncientTree />;
      default: return <Sprout />;
    }
  };

  return (
    <Svg width={size} height={height} viewBox="0 0 60 80">
      {shape()}
    </Svg>
  );
}
