<?php

namespace App\Enums;

trait HasLabel
{
    public function label(): string
    {
        $key = 'enums.'.static::class.'.'.$this->value;
        $translated = __($key);

        if ($translated !== $key) {
            return $translated;
        }

        if (method_exists($this, 'frenchLabel')) {
            return $this->frenchLabel();
        }

        return $this->value;
    }

    /** @return array<int, array{value: string, label: string}> */
    public static function options(): array
    {
        return array_map(
            fn ($c) => ['value' => $c->value, 'label' => $c->label()],
            self::cases()
        );
    }
}
