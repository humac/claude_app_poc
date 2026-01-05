import React from 'react';
import { cn } from '@/lib/utils';
import { FileQuestion, AlertCircle, Search } from 'lucide-react';

const EmptyState = ({
    icon: Icon = FileQuestion,
    title = 'No data available',
    description = 'There are no items to display at this time.',
    className,
    action
}) => {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 text-center animate-fade-in", className)}>
            <div className="bg-muted/30 p-4 rounded-full mb-4">
                <Icon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
