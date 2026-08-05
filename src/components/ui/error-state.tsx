import { Button, type ButtonVariant } from './button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card';

export interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  retryVariant?: ButtonVariant;
  secondaryAction?: { label: string; onPress: () => void };
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Retry',
  retryVariant = 'default',
  secondaryAction,
  className,
}: ErrorStateProps) {
  const hasActions = onRetry || secondaryAction;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {hasActions ? (
        <CardContent className={onRetry && secondaryAction ? 'gap-3' : undefined}>
          {onRetry ? (
            <Button variant={retryVariant} onPress={onRetry}>
              {retryLabel}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button variant="ghost" onPress={secondaryAction.onPress}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
