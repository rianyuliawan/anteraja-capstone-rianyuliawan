export const demoShipments = {
  "ANT-FRZ-0006": {
    awb: "ANT-FRZ-0006",
    stage: "OUT_FOR_DELIVERY",
    status: "Sedang diantar",
    sender: "T*** F***** B*****",
    recipient: "D*** P******",
    origin: "Kawasan Kelapa Gading, Jakarta Utara",
    destination: "Kawasan Tebet, Jakarta Selatan",
    latestDescription: "Kurir sedang membawa paket menuju kawasan penerima.",
    lastEventAt: "2026-09-18T15:58:00+07:00",
    temperature: {
      asset: "Cooler bag last mile",
      assetCode: "COOLER-BAG-06",
      valueC: -4.8,
      normalLowC: -8,
      normalHighC: -2,
      observedAt: "2026-09-18T15:50:00+07:00",
      nextUpdateAt: "2026-09-18T16:50:00+07:00",
      state: "normal",
    },
    events: [
      {
        id: "delivery",
        status: "Sedang diantar",
        title: "Kurir menuju kawasan penerima",
        description: "SATRIA Dimas P. membawa paket menggunakan cooler bag.",
        occurredAt: "2026-09-18T15:58:00+07:00",
      },
      {
        id: "left-hub",
        status: "Keluar dari hub",
        title: "Berangkat dari Hub Tebet",
        description: "Paket diserahkan kepada kurir last mile.",
        occurredAt: "2026-09-18T15:20:00+07:00",
      },
      {
        id: "hub",
        status: "Tiba di hub",
        title: "Tiba di Hub Tebet",
        description: "Paket masuk ke area penyimpanan dingin.",
        occurredAt: "2026-09-18T13:45:00+07:00",
      },
      {
        id: "pickup",
        status: "Paket diambil",
        title: "Paket diambil dari pengirim",
        description:
          "Kurir pickup SATRIA Bima R. menerima paket dalam kondisi baik.",
        occurredAt: "2026-09-18T10:05:00+07:00",
      },
    ],
    route: {
      completedIndex: 2,
      points: [
        {
          id: "pickup",
          label: "Kelapa Gading",
          latitude: -6.158,
          longitude: 106.906,
        },
        {
          id: "hub-north",
          label: "Hub Jakarta Utara",
          latitude: -6.143,
          longitude: 106.891,
        },
        {
          id: "hub-tebet",
          label: "Hub Tebet",
          latitude: -6.235,
          longitude: 106.856,
        },
        {
          id: "destination",
          label: "Kawasan Tebet",
          latitude: -6.238,
          longitude: 106.852,
        },
      ],
    },
    pickup: {
      imageUrl: "/images/evidence/ANT-FRZ-0002-pickup.webp",
      occurredAt: "2026-09-18T10:05:00+07:00",
      courier: "SATRIA Bima R.",
      party: "T*** F***** B***** (pengirim)",
      note: "Paket diterima tanpa kerusakan kemasan.",
      location: "Kawasan Kelapa Gading, Jakarta Utara",
    },
    segments: [
      {
        id: "1",
        asset: "Cooler Bag CB-06",
        description: "Penjemputan awal",
        valueC: -5.6,
        state: "complete",
      },
      {
        id: "2",
        asset: "Hub Freezer HF-06",
        description: "Penyimpanan hub",
        valueC: -4.6,
        state: "complete",
      },
      {
        id: "3",
        asset: "Cooler Bag CB-16",
        description: "Pengantaran last mile",
        valueC: -4.8,
        state: "active",
      },
    ],
    history: [
      {
        id: "1550",
        asset: "Cooler Bag CB-16",
        valueC: -4.8,
        observedAt: "2026-09-18T15:50:00+07:00",
        state: "normal",
      },
      {
        id: "1458",
        asset: "Hub Freezer HF-06",
        valueC: -4.9,
        observedAt: "2026-09-18T14:58:00+07:00",
        state: "normal",
      },
      {
        id: "1358",
        asset: "Hub Freezer HF-06",
        valueC: -5,
        observedAt: "2026-09-18T13:58:00+07:00",
        state: "normal",
      },
      {
        id: "1258",
        asset: "Cooler Bag CB-06",
        valueC: -4.6,
        observedAt: "2026-09-18T12:58:00+07:00",
        state: "normal",
      },
      {
        id: "1158",
        asset: "Cooler Bag CB-06",
        valueC: -5.6,
        observedAt: "2026-09-18T11:58:00+07:00",
        state: "normal",
      },
    ],
  },
  "ANT-FRZ-0009": {
    awb: "ANT-FRZ-0009",
    stage: "AT_HUB",
    status: "Tiba di hub",
    sender: "C*** K******",
    recipient: "A*** S******",
    origin: "Kawasan Cibubur, Jakarta Timur",
    destination: "Kawasan Kebayoran Baru, Jakarta Selatan",
    latestDescription:
      "Paket telah diterima di hub transit untuk proses berikutnya.",
    lastEventAt: "2026-09-18T15:55:00+07:00",
    temperature: {
      asset: "Hub freezer",
      assetCode: "HUB-FREEZER-09",
      valueC: null,
      normalLowC: -5,
      normalHighC: -2,
      observedAt: null,
      nextUpdateAt: "2026-09-18T16:55:00+07:00",
      state: "pending",
    },
    events: [
      {
        id: "hub",
        status: "Tiba di hub",
        title: "Tiba di Hub Cawang",
        description: "Paket diterima di cold storage untuk sortasi.",
        occurredAt: "2026-09-18T15:55:00+07:00",
      },
      {
        id: "travel",
        status: "Dalam perjalanan",
        title: "Menuju Hub Cawang",
        description: "Armada pendingin bergerak menuju hub transit.",
        occurredAt: "2026-09-18T14:20:00+07:00",
      },
      {
        id: "pickup",
        status: "Paket diambil",
        title: "Paket diambil dari pengirim",
        description: "Kurir pickup SATRIA Candra A. telah memverifikasi segel.",
        occurredAt: "2026-09-18T12:10:00+07:00",
      },
    ],
    route: {
      completedIndex: 1,
      points: [
        {
          id: "pickup",
          label: "Cibubur",
          latitude: -6.355,
          longitude: 106.883,
        },
        {
          id: "hub-cawang",
          label: "Hub Cawang",
          latitude: -6.245,
          longitude: 106.875,
        },
        {
          id: "hub-kebayoran",
          label: "Hub Kebayoran",
          latitude: -6.244,
          longitude: 106.8,
        },
        {
          id: "destination",
          label: "Kebayoran Baru",
          latitude: -6.242,
          longitude: 106.794,
        },
      ],
    },
    pickup: {
      imageUrl: "/images/evidence/ANT-FRZ-0002-pickup.webp",
      occurredAt: "2026-09-18T12:10:00+07:00",
      courier: "SATRIA Candra A.",
      party: "C*** K****** (pengirim)",
      note: "Segel dan label pengiriman terverifikasi.",
      location: "Kawasan Cibubur, Jakarta Timur",
    },
    segments: [
      {
        id: "1",
        asset: "Cooler Bag CB-09",
        description: "Penjemputan awal",
        valueC: -5,
        state: "complete",
      },
      {
        id: "2",
        asset: "Hub Freezer HF-09",
        description: "Penyimpanan hub",
        valueC: null,
        state: "active",
      },
    ],
    history: [
      {
        id: "1455",
        asset: "Cooler Bag CB-09",
        valueC: -4.4,
        observedAt: "2026-09-18T14:55:00+07:00",
        state: "normal",
      },
      {
        id: "1355",
        asset: "Cooler Bag CB-09",
        valueC: -4.1,
        observedAt: "2026-09-18T13:55:00+07:00",
        state: "normal",
      },
      {
        id: "1255",
        asset: "Cooler Bag CB-09",
        valueC: -4.7,
        observedAt: "2026-09-18T12:55:00+07:00",
        state: "normal",
      },
    ],
  },
  "ANT-FRZ-0002": {
    awb: "ANT-FRZ-0002",
    stage: "IN_TRANSIT",
    status: "Dalam perjalanan",
    sender: "PT S***** L*** S****",
    recipient: "R**** D***",
    origin: "Kawasan Kemayoran, Jakarta Pusat",
    destination: "Kawasan Pasar Minggu, Jakarta Selatan",
    latestDescription: "Berangkat dari hub dan sedang menuju titik berikutnya.",
    lastEventAt: "2026-09-18T14:30:00+07:00",
    temperature: {
      asset: "Mobil boks pendingin",
      assetCode: "REEFER-BOX-01",
      valueC: -5.1,
      normalLowC: -8,
      normalHighC: -2,
      observedAt: "2026-09-18T14:30:00+07:00",
      nextUpdateAt: "2026-09-18T15:30:00+07:00",
      state: "normal",
    },
    events: [
      {
        id: "in-transit",
        status: "Dalam perjalanan",
        title: "Berangkat menuju hub tujuan",
        description:
          "Perjalanan antartitik menuju Hub Pasar Minggu telah tercatat.",
        occurredAt: "2026-09-18T14:30:00+07:00",
      },
      {
        id: "left-hub",
        status: "Keluar dari hub",
        title: "Berangkat dari Hub Cempaka Mas",
        description:
          "Paket tercatat keluar dari titik transit untuk melanjutkan perjalanan.",
        occurredAt: "2026-09-18T13:15:00+07:00",
      },
      {
        id: "at-hub",
        status: "Tiba di hub",
        title: "Tiba di Hub Cempaka Mas",
        description: "Paket telah tercatat tiba di titik transit.",
        occurredAt: "2026-09-18T11:40:00+07:00",
      },
      {
        id: "picked-up",
        status: "Paket diambil",
        title: "Paket diambil dari titik pickup",
        description:
          "Kurir pickup SATRIA Ahmad F. menerima paket di kawasan Kemayoran.",
        occurredAt: "2026-09-18T09:15:00+07:00",
      },
    ],
    route: {
      completedIndex: 1,
      points: [
        {
          id: "pickup",
          label: "Kemayoran",
          latitude: -6.166,
          longitude: 106.853,
        },
        {
          id: "hub-1",
          label: "Hub Cempaka Mas",
          latitude: -6.174,
          longitude: 106.875,
        },
        {
          id: "hub-2",
          label: "Hub Pasar Minggu",
          latitude: -6.287,
          longitude: 106.845,
        },
        {
          id: "destination",
          label: "Kawasan tujuan",
          latitude: -6.289,
          longitude: 106.838,
        },
      ],
    },
    pickup: {
      imageUrl: "/images/evidence/ANT-FRZ-0002-pickup.webp",
      occurredAt: "2026-09-18T09:15:00+07:00",
      courier: "SATRIA Ahmad F.",
      party: "PT S***** L*** S**** (pengirim)",
      note: "Paket dan segel diterima dalam kondisi baik.",
      location: "Kawasan Kemayoran, Jakarta Pusat",
    },
    segments: [
      {
        id: "1",
        asset: "Cooler Bag CB-12",
        description: "Penjemputan awal",
        valueC: -5.4,
        state: "complete",
      },
      {
        id: "2",
        asset: "Hub Freezer HF-03",
        description: "Penyimpanan hub",
        valueC: -4.1,
        state: "complete",
      },
      {
        id: "3",
        asset: "Mobil Boks BOX-01",
        description: "Perjalanan antarhub",
        valueC: -5.1,
        state: "active",
      },
    ],
    history: [
      {
        id: "1430",
        asset: "Mobil Boks BOX-01",
        valueC: -5.1,
        observedAt: "2026-09-18T14:30:00+07:00",
        state: "normal",
      },
      {
        id: "1330",
        asset: "Mobil Boks BOX-01",
        valueC: -5.3,
        observedAt: "2026-09-18T13:30:00+07:00",
        state: "normal",
      },
      {
        id: "1230",
        asset: "Hub Freezer HF-03",
        valueC: -5.0,
        observedAt: "2026-09-18T12:30:00+07:00",
        state: "normal",
      },
    ],
  },
  "ANT-FRZ-0012": {
    awb: "ANT-FRZ-0012",
    stage: "DELIVERED",
    status: "Terkirim",
    sender: "PT P***** N********",
    recipient: "S**** W******",
    origin: "Kawasan Cakung, Jakarta Timur",
    destination: "Kawasan Koja, Jakarta Utara",
    latestDescription: "Diterima oleh penerima langsung. Dokumentasi tersedia.",
    lastEventAt: "2026-09-18T15:52:00+07:00",
    temperature: {
      asset: "Cooler bag last mile",
      assetCode: "BAG-012",
      valueC: -5,
      normalLowC: -8,
      normalHighC: -2,
      observedAt: "2026-09-18T15:45:00+07:00",
      state: "normal",
    },
    events: [
      {
        id: "delivered",
        status: "Terkirim",
        title: "Paket telah diterima",
        description:
          "Delivery sukses oleh SATRIA Nanda R. Paket diterima langsung oleh S**** W****** dalam kondisi baik #PastiBawaHappy.",
        occurredAt: "2026-09-18T15:52:00+07:00",
      },
      {
        id: "out-for-delivery",
        status: "Sedang diantar",
        title: "Kurir menuju kawasan penerima",
        description: "SATRIA Nanda R. membawa paket menuju kawasan Koja.",
        occurredAt: "2026-09-18T14:46:00+07:00",
      },
      {
        id: "left-hub",
        status: "Keluar dari hub",
        title: "Berangkat dari Hub Jakarta Utara",
        description: "Paket diserahkan ke kurir last mile.",
        occurredAt: "2026-09-18T14:00:00+07:00",
      },
      {
        id: "at-hub",
        status: "Tiba di hub",
        title: "Tiba di Hub Jakarta Utara",
        description: "Paket disimpan pada freezer.",
        occurredAt: "2026-09-18T13:29:00+07:00",
      },
      {
        id: "picked-up",
        status: "Paket diambil",
        title: "Paket diambil dari titik pickup",
        description:
          "Kurir pickup SATRIA Ahmad F. menerima paket di kawasan Cakung.",
        occurredAt: "2026-09-18T12:33:00+07:00",
      },
    ],
    route: {
      completedIndex: 3,
      points: [
        { id: "pickup", label: "Cakung", latitude: -6.174, longitude: 106.947 },
        {
          id: "hub",
          label: "Hub Jakarta Utara",
          latitude: -6.13,
          longitude: 106.9,
        },
        {
          id: "last-mile",
          label: "Pengantaran terakhir",
          latitude: -6.115,
          longitude: 106.912,
        },
        {
          id: "destination",
          label: "Koja",
          latitude: -6.111,
          longitude: 106.92,
        },
      ],
    },
    pickup: {
      imageUrl: "/images/evidence/ANT-FRZ-0012-pickup.webp",
      occurredAt: "2026-09-18T12:33:00+07:00",
      courier: "SATRIA Ahmad F.",
      party: "PT P***** N******** (pengirim)",
      note: "Paket dan segel diterima dalam kondisi baik.",
      location: "Kawasan Cakung, Jakarta Timur",
    },
    delivery: {
      imageUrl: "/images/evidence/ANT-FRZ-0012-delivery.webp",
      occurredAt: "2026-09-18T15:52:00+07:00",
      courier: "SATRIA Nanda R.",
      party: "S**** W****** (penerima langsung)",
      note: "Paket diterima dalam kondisi baik.",
      location: "Kawasan Koja, Jakarta Utara",
    },
    segments: [
      {
        id: "1",
        asset: "Cooler Bag BAG-012",
        description: "Penjemputan awal",
        valueC: -5.6,
        state: "complete",
      },
      {
        id: "2",
        asset: "Hub Freezer JKT-UTR",
        description: "Penyimpanan hub",
        valueC: -4.4,
        state: "complete",
      },
      {
        id: "3",
        asset: "Mobil Boks BOX-06",
        description: "Perjalanan antarhub",
        valueC: -5.2,
        state: "complete",
      },
      {
        id: "4",
        asset: "Cooler Bag BAG-012",
        description: "Pengantaran last mile",
        valueC: -5,
        state: "complete",
      },
    ],
    history: [
      {
        id: "1545",
        asset: "Cooler Bag BAG-012",
        valueC: -5,
        observedAt: "2026-09-18T15:45:00+07:00",
        state: "normal",
      },
      {
        id: "1452",
        asset: "Cooler Bag BAG-012",
        valueC: -5.3,
        observedAt: "2026-09-18T14:52:00+07:00",
        state: "normal",
      },
      {
        id: "1352",
        asset: "Hub Freezer JKT-UTR",
        valueC: -5.2,
        observedAt: "2026-09-18T13:52:00+07:00",
        state: "normal",
      },
      {
        id: "1252",
        asset: "Cooler Bag BAG-012",
        valueC: -4.4,
        observedAt: "2026-09-18T12:52:00+07:00",
        state: "normal",
      },
    ],
  },
  "ANT-FRZ-0014": {
    awb: "ANT-FRZ-0014",
    stage: "DELIVERED",
    status: "Terkirim",
    sender: "D**** F*** S*****",
    recipient: "M***** R******",
    origin: "Kawasan Palmerah, Jakarta Barat",
    destination: "Kawasan Menteng, Jakarta Pusat",
    latestDescription:
      "Diterima petugas keamanan dan ditempatkan di area penerimaan.",
    lastEventAt: "2026-09-18T16:02:00+07:00",
    temperature: {
      asset: "Cooler bag last mile",
      assetCode: "BAG-014",
      valueC: -4.7,
      normalLowC: -8,
      normalHighC: -2,
      observedAt: "2026-09-18T15:50:00+07:00",
      state: "normal",
    },
    events: [
      {
        id: "delivered",
        status: "Terkirim",
        title: "Paket diterima petugas keamanan",
        description:
          "SATRIA Raka D. menyerahkan paket kepada Bapak A*** di area penerimaan.",
        occurredAt: "2026-09-18T16:02:00+07:00",
      },
      {
        id: "delivery",
        status: "Sedang diantar",
        title: "Kurir menuju kawasan penerima",
        description: "Paket dibawa menuju kawasan Menteng.",
        occurredAt: "2026-09-18T15:12:00+07:00",
      },
      {
        id: "left-hub",
        status: "Keluar dari hub",
        title: "Berangkat dari Hub Jakarta Pusat",
        description: "Paket diserahkan ke kurir last mile.",
        occurredAt: "2026-09-18T14:35:00+07:00",
      },
      {
        id: "hub",
        status: "Tiba di hub",
        title: "Tiba di Hub Jakarta Pusat",
        description: "Paket disimpan pada freezer.",
        occurredAt: "2026-09-18T13:10:00+07:00",
      },
      {
        id: "pickup",
        status: "Paket diambil",
        title: "Paket diambil dari titik pickup",
        description: "Kurir pickup SATRIA Raka D. menerima paket.",
        occurredAt: "2026-09-18T10:20:00+07:00",
      },
    ],
    route: {
      completedIndex: 3,
      points: [
        {
          id: "pickup",
          label: "Palmerah",
          latitude: -6.19,
          longitude: 106.797,
        },
        {
          id: "hub",
          label: "Hub Jakarta Pusat",
          latitude: -6.18,
          longitude: 106.83,
        },
        {
          id: "last-mile",
          label: "Pengantaran terakhir",
          latitude: -6.185,
          longitude: 106.835,
        },
        {
          id: "destination",
          label: "Menteng",
          latitude: -6.195,
          longitude: 106.84,
        },
      ],
    },
    pickup: {
      imageUrl: "/images/evidence/ANT-FRZ-0002-pickup.webp",
      occurredAt: "2026-09-18T10:20:00+07:00",
      courier: "SATRIA Raka D.",
      party: "D**** F*** S***** (pengirim)",
      note: "Paket diterima dalam kondisi baik.",
      location: "Kawasan Palmerah, Jakarta Barat",
    },
    delivery: {
      imageUrl: "/images/evidence/ANT-FRZ-0012-delivery.webp",
      occurredAt: "2026-09-18T16:02:00+07:00",
      courier: "SATRIA Raka D.",
      party: "Bapak A*** (petugas keamanan)",
      note: "Ditempatkan di area penerimaan gedung.",
      location: "Kawasan Menteng, Jakarta Pusat",
    },
    segments: [
      {
        id: "1",
        asset: "Cooler Bag BAG-014",
        description: "Penjemputan awal",
        valueC: -5.1,
        state: "complete",
      },
      {
        id: "2",
        asset: "Hub Freezer JKT-PST",
        description: "Penyimpanan hub",
        valueC: -4.3,
        state: "complete",
      },
      {
        id: "3",
        asset: "Cooler Bag BAG-014",
        description: "Pengantaran last mile",
        valueC: -4.7,
        state: "complete",
      },
    ],
    history: [
      {
        id: "1550",
        asset: "Cooler Bag BAG-014",
        valueC: -4.7,
        observedAt: "2026-09-18T15:50:00+07:00",
        state: "normal",
      },
      {
        id: "1502",
        asset: "Cooler Bag BAG-014",
        valueC: -4.8,
        observedAt: "2026-09-18T15:02:00+07:00",
        state: "normal",
      },
      {
        id: "1402",
        asset: "Hub Freezer JKT-PST",
        valueC: -4.5,
        observedAt: "2026-09-18T14:02:00+07:00",
        state: "normal",
      },
      {
        id: "1302",
        asset: "Cooler Bag BAG-014",
        valueC: -4.3,
        observedAt: "2026-09-18T13:02:00+07:00",
        state: "normal",
      },
      {
        id: "1202",
        asset: "Cooler Bag BAG-014",
        valueC: -5.1,
        observedAt: "2026-09-18T12:02:00+07:00",
        state: "normal",
      },
    ],
  },
};
const shiftTime = (value, offsetMs) =>
  new Date(new Date(value).getTime() + offsetMs).toISOString();
export function createDemoShipments() {
  const shipments = structuredClone(demoShipments);
  for (const shipment of Object.values(shipments)) {
    if (shipment.stage === "DELIVERED") continue;
    const offsetMs =
      Date.now() - 15 * 60_000 - new Date(shipment.lastEventAt).getTime();
    shipment.lastEventAt = shiftTime(shipment.lastEventAt, offsetMs);
    shipment.events = shipment.events.map((event) => ({
      ...event,
      occurredAt: shiftTime(event.occurredAt, offsetMs),
    }));
    shipment.history = shipment.history.map((item) => ({
      ...item,
      observedAt: shiftTime(item.observedAt, offsetMs),
    }));
    if (shipment.temperature.observedAt)
      shipment.temperature.observedAt = shiftTime(
        shipment.temperature.observedAt,
        offsetMs,
      );
    if (shipment.temperature.nextUpdateAt)
      shipment.temperature.nextUpdateAt = shiftTime(
        shipment.temperature.nextUpdateAt,
        offsetMs,
      );
    if (shipment.pickup)
      shipment.pickup.occurredAt = shiftTime(
        shipment.pickup.occurredAt,
        offsetMs,
      );
  }
  return shipments;
}
export const currentDemoShipments = createDemoShipments();
