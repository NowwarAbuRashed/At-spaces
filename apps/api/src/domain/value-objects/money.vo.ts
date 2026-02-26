import { DomainException } from '../exceptions/domain.exception';

export class Money {
    readonly amount: number;
    readonly currency: string;

    private constructor(amount: number, currency: string) {
        this.amount = amount;
        this.currency = currency;
    }

    static create(amount: number, currency: string = 'JOD'): Money {
        if (amount < 0) {
            throw new DomainException('Amount cannot be negative');
        }
        return new Money(amount, currency);
    }

    add(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new DomainException('Cannot add money with different currencies');
        }
        return new Money(this.amount + other.amount, this.currency);
    }

    multiply(factor: number): Money {
        if (factor < 0) {
            throw new DomainException('Multiplier cannot be negative');
        }
        return new Money(this.amount * factor, this.currency);
    }

    equals(other: Money): boolean {
        return this.amount === other.amount && this.currency === other.currency;
    }
}
