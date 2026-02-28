'use client';

import type { FormField } from '@formai/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface FieldRendererProps {
  field: FormField;
  register: UseFormRegister<Record<string, unknown>>;
  errors: FieldErrors;
  value?: unknown;
}

export function FieldRenderer({ field, register, errors }: FieldRendererProps) {
  const error = errors[field.name];

  // Skip layout-only fields
  if (['section', 'heading', 'paragraph'].includes(field.type)) {
    if (field.type === 'heading') {
      return <h3 className="text-lg font-semibold mt-4 mb-2">{field.label}</h3>;
    }
    if (field.type === 'section') {
      return <hr className="my-4 border-border" />;
    }
    if (field.type === 'paragraph') {
      return <p className="text-sm text-muted-foreground mb-2">{field.helpText || field.label}</p>;
    }
    return null;
  }

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...register(field.name, { required: field.required ? `${field.label} est obligatoire` : false })}
            placeholder={field.placeholder}
            rows={4}
          />
        );

      case 'select':
        return (
          <select
            {...register(field.name, { required: field.required ? `${field.label} est obligatoire` : false })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">{field.placeholder || 'Sélectionner...'}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="flex flex-col gap-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  {...register(field.name, { required: field.required ? `${field.label} est obligatoire` : false })}
                  value={opt.value}
                  className="h-4 w-4"
                />
                {opt.label}
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register(field.name)}
              className="h-4 w-4 rounded"
            />
            {field.label}
          </label>
        );

      case 'date':
        return (
          <Input
            type="date"
            {...register(field.name, { required: field.required ? `${field.label} est obligatoire` : false })}
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            {...register(field.name, { required: field.required ? `${field.label} est obligatoire` : false })}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            {...register(field.name, {
              required: field.required ? `${field.label} est obligatoire` : false,
              valueAsNumber: true,
              min: field.validation?.min,
              max: field.validation?.max,
            })}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            {...register(field.name, {
              required: field.required ? `${field.label} est obligatoire` : false,
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' },
            })}
            placeholder={field.placeholder}
          />
        );

      case 'phone':
        return (
          <Input
            type="tel"
            {...register(field.name, { required: field.required ? `${field.label} est obligatoire` : false })}
            placeholder={field.placeholder}
          />
        );

      case 'file':
      case 'image':
        return (
          <Input
            type="file"
            {...register(field.name)}
            accept={field.type === 'image' ? 'image/*' : undefined}
          />
        );

      default:
        return (
          <Input
            type="text"
            {...register(field.name, {
              required: field.required ? `${field.label} est obligatoire` : false,
              minLength: field.validation?.minLength
                ? { value: field.validation.minLength, message: `Minimum ${field.validation.minLength} caractères` }
                : undefined,
              maxLength: field.validation?.maxLength
                ? { value: field.validation.maxLength, message: `Maximum ${field.validation.maxLength} caractères` }
                : undefined,
            })}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const width = field.layout?.width || 12;
  const colSpan = `col-span-${Math.min(width, 12)}`;

  return (
    <div className={colSpan} style={{ gridColumn: `span ${width} / span ${width}` }}>
      {field.type !== 'checkbox' && (
        <Label className="mb-2 block">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {field.helpText && field.type !== 'paragraph' && (
        <p className="text-xs text-muted-foreground mb-1">{field.helpText}</p>
      )}
      {renderInput()}
      {error && (
        <p className="text-xs text-destructive mt-1">{error.message as string}</p>
      )}
    </div>
  );
}
