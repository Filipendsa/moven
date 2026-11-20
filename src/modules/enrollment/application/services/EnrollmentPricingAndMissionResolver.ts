import { Result } from "@/shared/domain/Result";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { IEventOfferingRepository } from "@/modules/mission-catalog/domain/repositories/IEventOfferingRepository";
import { IMissionRepository } from "@/modules/mission-catalog/domain/repositories/IMissionRepository";
import { EventOffering } from "@/modules/mission-catalog/domain/entities/EventOffering";
import { Money } from "@/modules/mission-catalog/domain/value-objects/Money";
import { EnrollmentModality } from "../../domain/value-objects/EnrollmentModality";

export interface ResolvedEnrollmentSelection {
  offering: EventOffering;
  targetMissionId?: string;
  targetMissionTitle?: string;
  isWaitlist: boolean;
  effectivePrice: Money;
}

export class EnrollmentPricingAndMissionResolver {
  public static async resolve(params: {
    modality: EnrollmentModality;
    missionId?: string;
    offeringRepo: IEventOfferingRepository;
    registrationRepo: IRegistrationRepository;
    missionRepo?: IMissionRepository;
    ignoreCapacityBlock?: boolean;
  }): Promise<Result<ResolvedEnrollmentSelection, Error>> {
    const offering = await params.offeringRepo.findByModality(
      params.modality.type
    );
    if (!offering) {
      return Result.fail(new Error("Modalidade não encontrada no catálogo."));
    }

    let targetMissionId: string | undefined = params.modality.includesAmazonasMission
      ? params.missionId
      : undefined;
    let targetMissionTitle: string | undefined;
    let isWaitlist = false;
    let effectivePrice = offering.price;

    if (params.modality.includesAmazonasMission && params.missionRepo) {
      const mission = params.missionId
        ? await params.missionRepo.findById(params.missionId)
        : await params.missionRepo.findFeatured();

      if (params.missionId && !mission) {
        return Result.fail(new Error("Missão selecionada não encontrada."));
      }

      if (mission) {
        targetMissionId = mission.id;
        targetMissionTitle = mission.title;

        const counts = await params.registrationRepo.countByMission(mission.id);
        if (!params.ignoreCapacityBlock && !mission.canEnroll(counts.paid)) {
          return Result.fail(
            new Error(
              `As inscrições para "${mission.title}" estão encerradas no momento.`
            )
          );
        }

        if (mission.isWaitlistMode(counts.paid)) {
          isWaitlist = true;
        }

        if (params.modality.type === "MISSION") {
          effectivePrice = mission.price;
        } else if (params.modality.type === "BOTH") {
          const schoolOffering = await params.offeringRepo.findByModality("SCHOOL");
          effectivePrice = schoolOffering
            ? schoolOffering.price.add(mission.price)
            : offering.price;
        }
      }
    } else if (
      params.modality.includesAmazonasMission &&
      offering.maxSlots !== null
    ) {
      const metrics = await params.registrationRepo.getMetrics();
      if (!offering.hasAvailableSlots(metrics.missaoPaidSlots)) {
        isWaitlist = true;
      }
    }

    return Result.ok({
      offering,
      targetMissionId,
      targetMissionTitle,
      isWaitlist,
      effectivePrice,
    });
  }
}
