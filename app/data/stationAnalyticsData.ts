export interface StationQuadratImage {
  id: string;
  quadratNumber: number;
  meterMark?: string;
  fileName: string;
  timestamp: string;
  imageUrl: string;
  altText: string;
  counts: {
    lc: number;
    pb: number;
    dc: number;
    dca: number;
    substrate?: number;
  };
  dominantClass: 'LC' | 'PB' | 'DC' | 'DCA';
  dominantColor: string;
  interceptPoints: Array<{
    id: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    label: string;
    classType: 'LC' | 'PB' | 'DC' | 'DCA';
    confidence: string;
  }>;
}

export const HP_S3_QUADRATS: StationQuadratImage[] = [
  {
    id: 'HP-Q01',
    quadratNumber: 1,
    fileName: 'IMG_4018_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 10:41 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB3l-UnoVdxKi4rHccx0NZmH6x_Su3NpqA4RWBQJJHbV1_-tum0s915En3raUv7p8UgGMhMtIKwjHiphd2vHDEJuQnHlHrds8uplVQPjvMHKLLNi5eIjQ4N409Be4J8-2At_pLdPAr45TlkPE3FLGvO2aYoBrz-ukT04MvAAwahNwsc93GBksqFOf0jI6p6aqVBTV-dU-OWo83HQI3Zyz1wIXWy8kYm-cqFP0KXgK9VnMv0Hmd_iCyc',
    altText:
      'Orthogonal scientific photo-quadrat of a tropical coral reef, showing vibrant branching coral and a square scale quadrat frame.',
    counts: { lc: 12, pb: 4, dc: 2, dca: 1 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 28, y: 34, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.96' },
      { id: 'p2', x: 45, y: 62, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.94' },
      { id: 'p3', x: 68, y: 28, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.91' },
      { id: 'p4', x: 74, y: 78, label: 'Dead Coral [DC]', classType: 'DC', confidence: '0.88' },
    ],
  },
  {
    id: 'HP-Q02',
    quadratNumber: 2,
    fileName: 'IMG_4019_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 10:44 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCaOFdrgLjOK4xysrA5dNzNglm3mA4bc8vC7H3PRtbjHumeGTQpQLLYE0cu-KdQY2GNVfhXGQpzco6vQNT9WgoJY1i1nYrZHRwSH1Qqbnf7DR8DwyjudVHdjoLlhVDI5LV3VRC8A1aHydiqjQh0g4XxqcjKwYfkPGqZ5voB8mITRS9Gp9h_Nk7IEpg3WzVerXKOWa-mtCjhtLh8v3oIsJ-vbLF9WFcj3SMPWAYwtsn8AaFOFGyJDcCs',
    altText:
      'Overhead underwater photo of table coral and massive coral colonies in clear shallow water, with scientific measurement points plotted over the reef surface.',
    counts: { lc: 15, pb: 2, dc: 1, dca: 0 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 35, y: 40, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.97' },
      { id: 'p2', x: 60, y: 55, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.95' },
      { id: 'p3', x: 80, y: 30, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.89' },
    ],
  },
  {
    id: 'HP-Q03',
    quadratNumber: 3,
    fileName: 'IMG_4020_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 10:47 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDgrFjv0HDCTRkMyX1j-OgyWgU_62aKXwd9asJiy_owNR3CC3SvymBtOiMa0te4rf3tmQlXZxgSbCcJO_f1TFQBd2P_TAO984jjQJ13z6OQs7F5NwSy6aTkEhVwrIcwY3oMIVn56yCql3-xnb4C1hgnN_q8Wxvv_7BJ0gzdETG-22lNtz1njpsxP4wxli2KapXJAOX3oI6fg6-Dd7zj0Gw77aE4ftbQEyu2JDIWSQ8hxUH4HSnDGV6Z',
    altText:
      'Scientific photographic quadrat showing partially bleached branching coral with pale tips contrasting against turf algae covered substrate.',
    counts: { lc: 9, pb: 7, dc: 2, dca: 1 },
    dominantClass: 'PB',
    dominantColor: '#E8A93C',
    interceptPoints: [
      { id: 'p1', x: 30, y: 35, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.93' },
      { id: 'p2', x: 55, y: 45, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.92' },
      { id: 'p3', x: 70, y: 70, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.91' },
      { id: 'p4', x: 20, y: 80, label: 'Dead Coral with Algae [DCA]', classType: 'DCA', confidence: '0.86' },
    ],
  },
  {
    id: 'HP-Q04',
    quadratNumber: 4,
    fileName: 'IMG_4021_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 10:50 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANHmlP3OiFX_mNzha0KWwf0K7WjX4xDEaUudWb60RwelHUOh3OtaA8bBvGvrMki0VOAsBLQZM0XLT1BNpSdBkP1Hcvne_vl8raLupg9aQ4khVXgC8OsLAjnJVs6iKZPYi4KFP-8CtoM6ZNPiSOufwqSTFeobP2V8c0Sfq2q4n1zQV8d2Tan1oAnz588cXVUjOuw9wpBMG5_-GFATjhWQNBVel856oqubCKEsaVhyC0-91ie70ZRWDM',
    altText:
      'Top-down marine quadrat photography showing massive coral mound with fine carbonate sand patches in shallow tropical waters.',
    counts: { lc: 14, pb: 1, dc: 1, dca: 0 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 42, y: 48, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.98' },
      { id: 'p2', x: 75, y: 65, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.94' },
      { id: 'p3', x: 25, y: 25, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.88' },
    ],
  },
  {
    id: 'HP-Q05',
    quadratNumber: 5,
    fileName: 'IMG_4022_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 10:52 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPooRoCsybJlbWO535v8HBYZYXdOB1_MHVcSAF_QKLzNjDO_9k0_cQWj-s9Jd4zfWajCZdgCz3caEIkc_dKOLd5HgYxm-0IgvfFBOnKrx25IsICgMkVGm6mQrMIlJpuLwqA-UZvpf0x2hYyHgidN9LFKUOmgPvGtk9W7r9soP7MXHsHgY4rgk4F3lPenXPRslVuKHJ7Zg0NYGgRMw3pCnB8l9Codc2M9f2BZdgbIM_4HBTA3djy3tt',
    altText:
      'Benthic survey photo of dead branching coral skeleton covered with fine filamentous turf algae on a reef flat under clear sunlit marine conditions.',
    counts: { lc: 6, pb: 3, dc: 5, dca: 4 },
    dominantClass: 'DCA',
    dominantColor: '#6B7A3A',
    interceptPoints: [
      { id: 'p1', x: 38, y: 44, label: 'Dead Coral with Algae [DCA]', classType: 'DCA', confidence: '0.92' },
      { id: 'p2', x: 62, y: 35, label: 'Dead Coral [DC]', classType: 'DC', confidence: '0.90' },
      { id: 'p3', x: 20, y: 70, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.85' },
    ],
  },
  {
    id: 'HP-Q06',
    quadratNumber: 6,
    fileName: 'IMG_4023_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 10:55 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB_2oPRYE4loffHJ8PE6KdiU38WH9ivwowfOm7pNkJe0BoPU0OLKMq5VnIqp0xlbsNrqCkmzyDviMH6iFnC7qBpp6QIYefxqOFMvx6-76VljYpBCuv0eXmDCP8sxRx-V04gfDPyOXblp7It-2qVHSkQjB4NyNzSGMFoGyqAIg75CO5xRfHqWT6zCoyvG8sBHU0xa9Eu_m8PLHiivfDamiGBvZemcJSeCUfOU4YEll1RFiy52cIvGfhJ',
    altText:
      'High precision orthogonal underwater photograph of massive brain coral with distinct ridge patterns alongside small coral colonies.',
    counts: { lc: 16, pb: 1, dc: 0, dca: 0 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 50, y: 50, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.99' },
      { id: 'p2', x: 25, y: 35, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.96' },
      { id: 'p3', x: 75, y: 65, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.87' },
    ],
  },
  {
    id: 'HP-Q07',
    quadratNumber: 7,
    fileName: 'IMG_4024_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 10:58 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpnLKsq8FHCg6oVJiVEXTEzjnHGaci2XiXWbAGTGwiUitGqgRW80HMuG3Q6ePTJWtGvKeDTeUB-4cNq2l_g5vFtNxqZ-tlVxIzkOzOGmQ0Ko01F92uLen5FPCyQ39bymxv6IUKaTYiJCTE77qiPcg1W_S2FIwDdXETYXKjGV-TckF521lzi3HL6s8aAFFW32gbJqzulyzvUlNDj3VIIe-wHi2K8OgdJhA6QwVkWn2oC-WdqWfWIf9g',
    altText:
      'Underwater research quadrat capture of severely bleached pale white branching coral with visible polyps.',
    counts: { lc: 7, pb: 8, dc: 2, dca: 1 },
    dominantClass: 'PB',
    dominantColor: '#E8A93C',
    interceptPoints: [
      { id: 'p1', x: 40, y: 40, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.95' },
      { id: 'p2', x: 65, y: 52, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.93' },
      { id: 'p3', x: 25, y: 70, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.89' },
      { id: 'p4', x: 80, y: 25, label: 'Dead Coral [DC]', classType: 'DC', confidence: '0.84' },
    ],
  },
  {
    id: 'HP-Q08',
    quadratNumber: 8,
    fileName: 'IMG_4025_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:01 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuABq1aVIMVDFKW92jOvRyMGMmc9BXDKeAhcsbBboGXllY66brq23LJKqcX_4hr-_7DsiHCXM2k-5SoXXM5uRCdCXGNkDV0rh65UWQ05Q6D_rtC-Qpe2KD8lbDtZPKhTtIN1hQaIpTNnusVwQE-lTrdCc3SG4ugmaXpoHp4zfMCYDngKwTnEhT6CtB-yqvYxToXRXHthhSYka2hvBsShymeMzXLevO_PndI5AH1k_dnCLYwCR-KCvbpD',
    altText:
      'Macro quadrant benthic quadrat displaying dense coral rubble with encrusting pink coralline algae and juvenile coral recruits on reef pavement.',
    counts: { lc: 10, pb: 2, dc: 4, dca: 1 },
    dominantClass: 'DC',
    dominantColor: '#8B8378',
    interceptPoints: [
      { id: 'p1', x: 35, y: 35, label: 'Dead Coral [DC]', classType: 'DC', confidence: '0.93' },
      { id: 'p2', x: 58, y: 60, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.91' },
      { id: 'p3', x: 75, y: 30, label: 'Dead Coral [DC]', classType: 'DC', confidence: '0.89' },
    ],
  },
  {
    id: 'HP-Q09',
    quadratNumber: 9,
    fileName: 'IMG_4026_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:04 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAgJqjI2NCy8i38qr68PvUb73JyRIjuhLiOn4XqgjfOO7_JNaydLNHK7F5lZDno5vGAXnOyWZPzQ3cvNwVgg3OCOyeGOGvSH9P6ULUCSBr-5eHNEL-BaR0s23aubdGUmTzQ7JuQypOZrvmzXduDRYZBOQ76OqHQ4yf_0xm8ptK7e9Co4HB4_FDM-Kxvei7Ly2y5J2GFdoT_LWz_nR9eb-_V1WLIRKw4evTXZapUwpKeLH4w_b2wURzc',
    altText:
      'Square orthogonal scientific quadrat framing tabular coral shelf in pristine condition surrounded by deep navy blue tropical sea.',
    counts: { lc: 17, pb: 0, dc: 1, dca: 0 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 50, y: 45, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.99' },
      { id: 'p2', x: 30, y: 65, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.97' },
      { id: 'p3', x: 70, y: 30, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.95' },
    ],
  },
  {
    id: 'HP-Q10',
    quadratNumber: 10,
    fileName: 'IMG_4027_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:07 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBfEWlFuEBb9-AfTtGRTgWoVm8tHH6mmK4uDgodFd6ZdslIXUGvMSfmutpbYeO5U9kC_BhoHF4AjbyEp2wMiLvrwXF0beJ5AXN5Cbp7RuyrCpafNFYgI3RUgQyo2Kxu89FQTM5G-KowssYhPdVW-5vvE7dZvJluXsTmwlvzLpebpsZmGvHayVKFs0g6-jPCw3648x6gbsTVbksyd0rWJVgzl5E8BvxkJSn0RQvNJnv7J3howjqdLO-m',
    altText:
      'Field quadrat image of diverse coral reef assemblage including plate corals, branching corals, and minor sediment accumulation.',
    counts: { lc: 13, pb: 3, dc: 1, dca: 1 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 45, y: 55, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.94' },
      { id: 'p2', x: 65, y: 35, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.90' },
      { id: 'p3', x: 25, y: 40, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.92' },
    ],
  },
  {
    id: 'HP-Q11',
    quadratNumber: 11,
    fileName: 'IMG_4028_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:10 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYlwqcScV3JEhEo2e9dFXHfEonE9EXKTNXueuYAO-oW-09L-tLrJGo66rt_Xm8kiRltbh4LP2hTk-T0ShcqSbiBmOO9TOPh7dsyYApzL1rr0N4BNpBoJ7dQIeuaJJ7x1nZlLYkqkKVeba3lcULoE7ATaQa6YFcXyI7o68l7OlLVIrSJSw604jw6tdY6v06elDy5QC4oBofyIyAmhErE8jxG68TlZFvH70YccZ8mWwPcoNsLFwJVNkk',
    altText:
      'High angle orthogonal photograph of marine transect frame centered on a massive coral head exhibiting partial bleaching along upper margins.',
    counts: { lc: 11, pb: 5, dc: 1, dca: 0 },
    dominantClass: 'PB',
    dominantColor: '#E8A93C',
    interceptPoints: [
      { id: 'p1', x: 50, y: 42, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.94' },
      { id: 'p2', x: 35, y: 65, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.92' },
      { id: 'p3', x: 65, y: 70, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.91' },
    ],
  },
  {
    id: 'HP-Q12',
    quadratNumber: 12,
    fileName: 'IMG_4029_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:13 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDfOHwCoj0FZ7Uni0fg6FkBXFXl3-2_gdQ1-6ywMdNDppMdb_6Lvo1DlJpTKIGXfl7_P9sCVtLaXAa_hzuhatXLTXk5D8CxiEC2ISaKVNys-96kEjJXcgQoirhVUFvSRn4jZostomPpqHgiR1R7GkRlNXAjoiZ7e1FhFHYGokBwG8CQA3wZ_4UYlof8fA6JP9JN5y8EI64M7qyRB4LdstD0wc6jXT8UbtJv72mxWI1QDnbh258rNy5X',
    altText:
      'Reef transect station quadrat end-point showing transition from healthy coral reef to sandy rubble apron with low juvenile colony density.',
    counts: { lc: 8, pb: 2, dc: 1, dca: 1 },
    dominantClass: 'DC',
    dominantColor: '#8B8378',
    interceptPoints: [
      { id: 'p1', x: 40, y: 50, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.91' },
      { id: 'p2', x: 65, y: 40, label: 'Dead Coral [DC]', classType: 'DC', confidence: '0.88' },
      { id: 'p3', x: 25, y: 30, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.86' },
    ],
  },
  // Page 2: Quadrats 13 to 24
  {
    id: 'HP-Q13',
    quadratNumber: 13,
    fileName: 'IMG_4030_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:16 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB3l-UnoVdxKi4rHccx0NZmH6x_Su3NpqA4RWBQJJHbV1_-tum0s915En3raUv7p8UgGMhMtIKwjHiphd2vHDEJuQnHlHrds8uplVQPjvMHKLLNi5eIjQ4N409Be4J8-2At_pLdPAr45TlkPE3FLGvO2aYoBrz-ukT04MvAAwahNwsc93GBksqFOf0jI6p6aqVBTV-dU-OWo83HQI3Zyz1wIXWy8kYm-cqFP0KXgK9VnMv0Hmd_iCyc',
    altText: 'Benthic survey quadrat 13 with table coral shelf.',
    counts: { lc: 14, pb: 2, dc: 1, dca: 0 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 45, y: 45, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.97' },
    ],
  },
  {
    id: 'HP-Q14',
    quadratNumber: 14,
    fileName: 'IMG_4031_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:19 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCaOFdrgLjOK4xysrA5dNzNglm3mA4bc8vC7H3PRtbjHumeGTQpQLLYE0cu-KdQY2GNVfhXGQpzco6vQNT9WgoJY1i1nYrZHRwSH1Qqbnf7DR8DwyjudVHdjoLlhVDI5LV3VRC8A1aHydiqjQh0g4XxqcjKwYfkPGqZ5voB8mITRS9Gp9h_Nk7IEpg3WzVerXKOWa-mtCjhtLh8v3oIsJ-vbLF9WFcj3SMPWAYwtsn8AaFOFGyJDcCs',
    altText: 'Benthic survey quadrat 14 showing massive brain coral assembly.',
    counts: { lc: 13, pb: 3, dc: 1, dca: 0 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 50, y: 50, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.95' },
    ],
  },
  {
    id: 'HP-Q15',
    quadratNumber: 15,
    fileName: 'IMG_4032_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:22 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDgrFjv0HDCTRkMyX1j-OgyWgU_62aKXwd9asJiy_owNR3CC3SvymBtOiMa0te4rf3tmQlXZxgSbCcJO_f1TFQBd2P_TAO984jjQJ13z6OQs7F5NwSy6aTkEhVwrIcwY3oMIVn56yCql3-xnb4C1hgnN_q8Wxvv_7BJ0gzdETG-22lNtz1njpsxP4wxli2KapXJAOX3oI6fg6-Dd7zj0Gw77aE4ftbQEyu2JDIWSQ8hxUH4HSnDGV6Z',
    altText: 'Benthic survey quadrat 15 with pale bleached colonies.',
    counts: { lc: 8, pb: 6, dc: 2, dca: 1 },
    dominantClass: 'PB',
    dominantColor: '#E8A93C',
    interceptPoints: [
      { id: 'p1', x: 35, y: 40, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.92' },
    ],
  },
  {
    id: 'HP-Q16',
    quadratNumber: 16,
    fileName: 'IMG_4033_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:25 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANHmlP3OiFX_mNzha0KWwf0K7WjX4xDEaUudWb60RwelHUOh3OtaA8bBvGvrMki0VOAsBLQZM0XLT1BNpSdBkP1Hcvne_vl8raLupg9aQ4khVXgC8OsLAjnJVs6iKZPYi4KFP-8CtoM6ZNPiSOufwqSTFeobP2V8c0Sfq2q4n1zQV8d2Tan1oAnz588cXVUjOuw9wpBMG5_-GFATjhWQNBVel856oqubCKEsaVhyC0-91ie70ZRWDM',
    altText: 'Benthic survey quadrat 16 with massive coral mound.',
    counts: { lc: 15, pb: 1, dc: 0, dca: 0 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 48, y: 48, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.98' },
    ],
  },
  {
    id: 'HP-Q17',
    quadratNumber: 17,
    fileName: 'IMG_4034_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:28 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPooRoCsybJlbWO535v8HBYZYXdOB1_MHVcSAF_QKLzNjDO_9k0_cQWj-s9Jd4zfWajCZdgCz3caEIkc_dKOLd5HgYxm-0IgvfFBOnKrx25IsICgMkVGm6mQrMIlJpuLwqA-UZvpf0x2hYyHgidN9LFKUOmgPvGtk9W7r9soP7MXHsHgY4rgk4F3lPenXPRslVuKHJ7Zg0NYGgRMw3pCnB8l9Codc2M9f2BZdgbIM_4HBTA3djy3tt',
    altText: 'Benthic survey quadrat 17 with turf algae patches.',
    counts: { lc: 7, pb: 2, dc: 4, dca: 3 },
    dominantClass: 'DC',
    dominantColor: '#8B8378',
    interceptPoints: [
      { id: 'p1', x: 42, y: 40, label: 'Dead Coral [DC]', classType: 'DC', confidence: '0.89' },
    ],
  },
  {
    id: 'HP-Q18',
    quadratNumber: 18,
    fileName: 'IMG_4035_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:31 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB_2oPRYE4loffHJ8PE6KdiU38WH9ivwowfOm7pNkJe0BoPU0OLKMq5VnIqp0xlbsNrqCkmzyDviMH6iFnC7qBpp6QIYefxqOFMvx6-76VljYpBCuv0eXmDCP8sxRx-V04gfDPyOXblp7It-2qVHSkQjB4NyNzSGMFoGyqAIg75CO5xRfHqWT6zCoyvG8sBHU0xa9Eu_m8PLHiivfDamiGBvZemcJSeCUfOU4YEll1RFiy52cIvGfhJ',
    altText: 'Benthic survey quadrat 18 with robust live brain coral.',
    counts: { lc: 16, pb: 1, dc: 0, dca: 0 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 50, y: 50, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.97' },
    ],
  },
  {
    id: 'HP-Q19',
    quadratNumber: 19,
    fileName: 'IMG_4036_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:34 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpnLKsq8FHCg6oVJiVEXTEzjnHGaci2XiXWbAGTGwiUitGqgRW80HMuG3Q6ePTJWtGvKeDTeUB-4cNq2l_g5vFtNxqZ-tlVxIzkOzOGmQ0Ko01F92uLen5FPCyQ39bymxv6IUKaTYiJCTE77qiPcg1W_S2FIwDdXETYXKjGV-TckF521lzi3HL6s8aAFFW32gbJqzulyzvUlNDj3VIIe-wHi2K8OgdJhA6QwVkWn2oC-WdqWfWIf9g',
    altText: 'Benthic survey quadrat 19 with bleached branching coral.',
    counts: { lc: 9, pb: 6, dc: 1, dca: 1 },
    dominantClass: 'PB',
    dominantColor: '#E8A93C',
    interceptPoints: [
      { id: 'p1', x: 38, y: 44, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.93' },
    ],
  },
  {
    id: 'HP-Q20',
    quadratNumber: 20,
    fileName: 'IMG_4037_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:37 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuABq1aVIMVDFKW92jOvRyMGMmc9BXDKeAhcsbBboGXllY66brq23LJKqcX_4hr-_7DsiHCXM2k-5SoXXM5uRCdCXGNkDV0rh65UWQ05Q6D_rtC-Qpe2KD8lbDtZPKhTtIN1hQaIpTNnusVwQE-lTrdCc3SG4ugmaXpoHp4zfMCYDngKwTnEhT6CtB-yqvYxToXRXHthhSYka2hvBsShymeMzXLevO_PndI5AH1k_dnCLYwCR-KCvbpD',
    altText: 'Benthic survey quadrat 20 with encrusting pink algae.',
    counts: { lc: 11, pb: 2, dc: 3, dca: 1 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 45, y: 55, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.92' },
    ],
  },
  {
    id: 'HP-Q21',
    quadratNumber: 21,
    fileName: 'IMG_4038_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:40 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAgJqjI2NCy8i38qr68PvUb73JyRIjuhLiOn4XqgjfOO7_JNaydLNHK7F5lZDno5vGAXnOyWZPzQ3cvNwVgg3OCOyeGOGvSH9P6ULUCSBr-5eHNEL-BaR0s23aubdGUmTzQ7JuQypOZrvmzXduDRYZBOQ76OqHQ4yf_0xm8ptK7e9Ko4HB4_FDM-Kxvei7Ly2y5J2GFdoT_LWz_nR9eb-_V1WLIRKw4evTXZapUwpKeLH4w_b2wURzc',
    altText: 'Benthic survey quadrat 21 with sprawling tabular shelf.',
    counts: { lc: 16, pb: 1, dc: 0, dca: 0 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 52, y: 48, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.99' },
    ],
  },
  {
    id: 'HP-Q22',
    quadratNumber: 22,
    fileName: 'IMG_4039_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:43 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBfEWlFuEBb9-AfTtGRTgWoVm8tHH6mmK4uDgodFd6ZdslIXUGvMSfmutpbYeO5U9kC_BhoHF4AjbyEp2wMiLvrwXF0beJ5AXN5Cbp7RuyrCpafNFYgI3RUgQyo2Kxu89FQTM5G-KowssYhPdVW-5vvE7dZvJluXsTmwlvzLpebpsZmGvHayVKFs0g6-jPCw3648x6gbsTVbksyd0rWJVgzl5E8BvxkJSn0RQvNJnv7J3howjqdLO-m',
    altText: 'Benthic survey quadrat 22 with branching and plate coral.',
    counts: { lc: 12, pb: 3, dc: 2, dca: 0 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 44, y: 50, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.94' },
    ],
  },
  {
    id: 'HP-Q23',
    quadratNumber: 23,
    fileName: 'IMG_4040_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:46 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYlwqcScV3JEhEo2e9dFXHfEonE9EXKTNXueuYAO-oW-09L-tLrJGo66rt_Xm8kiRltbh4LP2hTk-T0ShcqSbiBmOO9TOPh7dsyYApzL1rr0N4BNpBoJ7dQIeuaJJ7x1nZlLYkqkKVeba3lcULoE7ATaQa6YFcXyI7o68l7OlLVIrSJSw604jw6tdY6v06elDy5QC4oBofyIyAmhErE8jxG68TlZFvH70YccZ8mWwPcoNsLFwJVNkk',
    altText: 'Benthic survey quadrat 23 showing massive coral head with pale margins.',
    counts: { lc: 10, pb: 5, dc: 1, dca: 1 },
    dominantClass: 'PB',
    dominantColor: '#E8A93C',
    interceptPoints: [
      { id: 'p1', x: 46, y: 46, label: 'Pale / Bleached [PB]', classType: 'PB', confidence: '0.93' },
    ],
  },
  {
    id: 'HP-Q24',
    quadratNumber: 24,
    fileName: 'IMG_4041_HP_S3.JPG',
    timestamp: 'Mar 4, 2026 · 11:49 UTC',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDfOHwCoj0FZ7Uni0fg6FkBXFXl3-2_gdQ1-6ywMdNDppMdb_6Lvo1DlJpTKIGXfl7_P9sCVtLaXAa_hzuhatXLTXk5D8CxiEC2ISaKVNys-96kEjJXcgQoirhVUFvSRn4jZostomPpqHgiR1R7GkRlNXAjoiZ7e1FhFHYGokBwG8CQA3wZ_4UYlof8fA6JP9JN5y8EI64M7qyRB4LdstD0wc6jXT8UbtJv72mxWI1QDnbh258rNy5X',
    altText: 'Benthic survey quadrat 24 reef terminal boundary.',
    counts: { lc: 9, pb: 2, dc: 2, dca: 1 },
    dominantClass: 'LC',
    dominantColor: '#F2637A',
    interceptPoints: [
      { id: 'p1', x: 40, y: 52, label: 'Live Coral [LC]', classType: 'LC', confidence: '0.92' },
    ],
  },
];
