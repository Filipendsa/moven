import { Entity } from "@/shared/domain/Entity";
import { Result } from "@/shared/domain/Result";
import { Money } from "../value-objects/Money";

export type MissionStatus = "OPEN" | "WAITLIST_ONLY" | "CLOSED" | "COMPLETED";

export interface MissionProps {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  price: Money;
  minSlots: number;
  maxSlots: number | null;
  waitlistEnabled: boolean;
  even3CheckoutUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  status: MissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Mission extends Entity<MissionProps> {
  private constructor(props: MissionProps, id?: string) {
    super(props, id);
  }

  get slug(): string {
    return this.props.slug;
  }

  get title(): string {
    return this.props.title;
  }

  get subtitle(): string | undefined {
    return this.props.subtitle;
  }

  get description(): string {
    return this.props.description;
  }

  get location(): string {
    return this.props.location;
  }

  get startDate(): string {
    return this.props.startDate;
  }

  get endDate(): string {
    return this.props.endDate;
  }

  get price(): Money {
    return this.props.price;
  }

  get minSlots(): number {
    return this.props.minSlots;
  }

  get maxSlots(): number | null {
    return this.props.maxSlots;
  }

  get waitlistEnabled(): boolean {
    return this.props.waitlistEnabled;
  }

  get even3CheckoutUrl(): string | undefined {
    return this.props.even3CheckoutUrl;
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get status(): MissionStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public isWaitlistMode(paidCount: number): boolean {
    if (this.props.status === "WAITLIST_ONLY") return true;
    if (
      this.props.maxSlots !== null &&
      paidCount >= this.props.maxSlots &&
      this.props.waitlistEnabled
    ) {
      return true;
    }
    return false;
  }

  public canAcceptDirectPayment(paidCount: number): boolean {
    if (!this.props.isActive) return false;
    if (this.props.status !== "OPEN") return false;
    if (this.props.maxSlots === null) return true;
    return paidCount < this.props.maxSlots;
  }

  public canEnroll(paidCount: number): boolean {
    if (!this.props.isActive) return false;
    if (this.props.status === "CLOSED" || this.props.status === "COMPLETED") {
      return false;
    }
    if (this.canAcceptDirectPayment(paidCount)) return true;
    return this.isWaitlistMode(paidCount);
  }

  public remainingBaseSlots(paidCount: number): number | null {
    if (this.props.maxSlots === null) return null;
    const diff = this.props.maxSlots - paidCount;
    return diff > 0 ? diff : 0;
  }

  public static create(
    params: Omit<MissionProps, "createdAt" | "updatedAt"> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: string
  ): Result<Mission, Error> {
    if (!params.title || params.title.trim().length < 3) {
      return Result.fail(new Error("Mission title must have at least 3 characters."));
    }
    if (!params.slug || params.slug.trim().length < 2) {
      return Result.fail(new Error("Mission slug is required."));
    }
    if (params.minSlots < 1) {
      return Result.fail(new Error("Minimum slots must be at least 1."));
    }

    const now = new Date();
    return Result.ok(
      new Mission(
        {
          ...params,
          title: params.title.trim(),
          slug: params.slug
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, "-"),
          createdAt: params.createdAt || now,
          updatedAt: params.updatedAt || now,
        },
        id
      )
    );
  }
}
