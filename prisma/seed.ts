// Seeds the 65 rooms / 140 beds described by the hostel:
//   - 60 rooms are 2-share (beds A, B)
//   - 5 rooms are 4-share (beds A, B, C, D)
// Room numbers are grouped into 5 floors (13 rooms each). The 4-share rooms
// are placed as the last room on each floor - edit ROOM_LAYOUT below if your
// real numbering differs.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FLOORS = 5;
const ROOMS_PER_FLOOR = 13; // 5 * 13 = 65 rooms

async function main() {
  const existing = await prisma.room.count();
  if (existing > 0) {
    console.log(`Rooms already seeded (${existing} rooms). Skipping.`);
    return;
  }

  let fourShareRemaining = 5;

  for (let floor = 1; floor <= FLOORS; floor++) {
    for (let pos = 1; pos <= ROOMS_PER_FLOOR; pos++) {
      const roomNumber = `${floor}${String(pos).padStart(2, "0")}`; // e.g. 101, 102 ... 513
      const isLastRoomOnFloor = pos === ROOMS_PER_FLOOR;
      const makeFourShare = isLastRoomOnFloor && fourShareRemaining > 0;
      const capacity = makeFourShare ? 4 : 2;
      if (makeFourShare) fourShareRemaining--;

      const labels = capacity === 4 ? ["A", "B", "C", "D"] : ["A", "B"];

      await prisma.room.create({
        data: {
          number: roomNumber,
          capacity,
          floor: `Floor ${floor}`,
          beds: {
            create: labels.map((label) => ({ label })),
          },
        },
      });
    }
  }

  const roomCount = await prisma.room.count();
  const bedCount = await prisma.bed.count();
  console.log(`Seeded ${roomCount} rooms and ${bedCount} beds.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
