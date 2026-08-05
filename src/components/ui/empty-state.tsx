import { Button, type ButtonVariant } from './button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card';

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
  actionVariant?: ButtonVariant;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  actionVariant = 'default',
  className,
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action ? (
        <CardContent>
          <Button variant={actionVariant} onPress={action.onPress}>
            {action.label}
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}
