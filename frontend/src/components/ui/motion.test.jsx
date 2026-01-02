import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  MotionDiv, 
  AnimatedCard, 
  StaggerContainer, 
  StaggerItem, 
  PageTransition,
  animations,
  transitions
} from '@/components/ui/motion';

describe('Motion Components', () => {
  describe('animations presets', () => {
    it('should have fadeIn animation', () => {
      expect(animations.fadeIn).toBeDefined();
      expect(animations.fadeIn).toHaveProperty('initial');
      expect(animations.fadeIn).toHaveProperty('animate');
      expect(animations.fadeIn).toHaveProperty('exit');
    });

    it('should have slideUp animation', () => {
      expect(animations.slideUp).toBeDefined();
      expect(animations.slideUp.initial).toHaveProperty('opacity', 0);
      expect(animations.slideUp.initial).toHaveProperty('y', 20);
    });

    it('should have scaleIn animation', () => {
      expect(animations.scaleIn).toBeDefined();
      expect(animations.scaleIn.initial).toHaveProperty('scale', 0.95);
    });

    it('should have blurIn animation', () => {
      expect(animations.blurIn).toBeDefined();
      expect(animations.blurIn.initial).toHaveProperty('filter', 'blur(10px)');
    });
  });

  describe('transition presets', () => {
    it('should have spring transition', () => {
      expect(transitions.spring).toBeDefined();
      expect(transitions.spring).toHaveProperty('type', 'spring');
      expect(transitions.spring).toHaveProperty('stiffness', 300);
    });

    it('should have smooth transition', () => {
      expect(transitions.smooth).toBeDefined();
      expect(transitions.smooth).toHaveProperty('type', 'tween');
    });

    it('should have expo transition', () => {
      expect(transitions.expo).toBeDefined();
      expect(transitions.expo).toHaveProperty('duration', 0.5);
    });
  });

  describe('MotionDiv', () => {
    it('should render children', () => {
      render(<MotionDiv>Test Content</MotionDiv>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(
        <MotionDiv className="custom-class">Test</MotionDiv>
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should apply animation preset', () => {
      render(<MotionDiv animation="slideUp">Test</MotionDiv>);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('AnimatedCard', () => {
    it('should render children', () => {
      render(<AnimatedCard>Card Content</AnimatedCard>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should have card styling classes', () => {
      const { container } = render(<AnimatedCard>Test</AnimatedCard>);
      const card = container.firstChild;
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-card');
    });

    it('should accept hoverScale prop', () => {
      render(<AnimatedCard hoverScale={1.05}>Test</AnimatedCard>);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('StaggerContainer and StaggerItem', () => {
    it('should render container with children', () => {
      render(
        <StaggerContainer>
          <StaggerItem>Item 1</StaggerItem>
          <StaggerItem>Item 2</StaggerItem>
        </StaggerContainer>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should accept staggerDelay prop', () => {
      render(
        <StaggerContainer staggerDelay={0.2}>
          <StaggerItem>Test</StaggerItem>
        </StaggerContainer>
      );
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('PageTransition', () => {
    it('should render children', () => {
      render(<PageTransition>Page Content</PageTransition>);
      expect(screen.getByText('Page Content')).toBeInTheDocument();
    });

    it('should accept additional props', () => {
      render(
        <PageTransition key="test-page">
          Page Content
        </PageTransition>
      );
      expect(screen.getByText('Page Content')).toBeInTheDocument();
    });
  });
});
