import { prisma } from "./prisma";

// Vacancy forecasting is heuristic, not ML-based: it uses each active
// inmate's declared "expected checkout date" (captured at registration /
// renewal) to project which beds are likely to free up by a future date.
// Inmates with no expected checkout date are treated as staying indefinitely
// and never counted as a projected vacancy.

export async function getCurrentOccupancy() {
  const rooms = await prisma.room.findMany({
    include: {
      beds: {
        include: {
          inmates: {
            where: { status: "ACTIVE" },
          },
        },
      },
    },
    orderBy: { number: "asc" },
  });

  const perRoom = rooms.map((room) => {
    const bedInfo = room.beds.map((bed) => {
      const activeInmate = bed.inmates.find((i) => i.status === "ACTIVE") || null;
      return {
        bedId: bed.id,
        label: bed.label,
        occupied: !!activeInmate,
        inmate: activeInmate
          ? {
              id: activeInmate.id,
              fullName: activeInmate.fullName,
              mobile: activeInmate.mobile,
              joinDate: activeInmate.joinDate,
              expectedCheckoutDate: activeInmate.expectedCheckoutDate,
            }
          : null,
      };
    });
    const occupied = bedInfo.filter((b) => b.occupied).length;
    return {
      roomId: room.id,
      number: room.number,
      floor: room.floor,
      capacity: room.capacity,
      occupied,
      vacant: room.capacity - occupied,
      beds: bedInfo,
    };
  });

  const totalBeds = perRoom.reduce((s, r) => s + r.capacity, 0);
  const occupiedBeds = perRoom.reduce((s, r) => s + r.occupied, 0);

  return {
    totalBeds,
    occupiedBeds,
    vacantBeds: totalBeds - occupiedBeds,
    perRoom,
  };
}

export async function getForecast(targetDate: Date) {
  const current = await getCurrentOccupancy();

  const activeInmates = await prisma.inmate.findMany({
    where: { status: "ACTIVE", expectedCheckoutDate: { not: null, lte: targetDate } },
    select: {
      id: true,
      fullName: true,
      expectedCheckoutDate: true,
      bed: { include: { room: true } },
    },
  });

  const projectedVacant = current.vacantBeds + activeInmates.length;
  const totalBeds = current.totalBeds;

  return {
    targetDate,
    totalBeds,
    currentVacantBeds: current.vacantBeds,
    additionalExpectedVacancies: activeInmates.map((i) => ({
      inmateId: i.id,
      fullName: i.fullName,
      expectedCheckoutDate: i.expectedCheckoutDate,
      room: i.bed?.room.number,
      bed: i.bed?.label,
    })),
    projectedVacantBeds: projectedVacant,
    projectedVacancyRate:
      totalBeds > 0 ? Math.round((projectedVacant / totalBeds) * 1000) / 10 : 0,
  };
}

export async function getUpcomingCheckoutTimeline(daysAhead = 90) {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + daysAhead);

  const inmates = await prisma.inmate.findMany({
    where: {
      status: "ACTIVE",
      expectedCheckoutDate: { not: null, gte: today, lte: end },
    },
    orderBy: { expectedCheckoutDate: "asc" },
    select: {
      id: true,
      fullName: true,
      expectedCheckoutDate: true,
      bed: { include: { room: true } },
    },
  });

  return inmates.map((i) => ({
    inmateId: i.id,
    fullName: i.fullName,
    expectedCheckoutDate: i.expectedCheckoutDate,
    room: i.bed?.room.number,
    bed: i.bed?.label,
  }));
}
