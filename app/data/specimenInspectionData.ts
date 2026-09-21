export interface SpecimenBoundingBox {
  id: string;
  boxNum: string;
  top: string;
  left: string;
  width: string;
  height: string;
  classType: 'LC' | 'PB' | 'DC' | 'DCA';
  symbol: string;
  label: string;
  benthicClass: string;
  confidence: string;
  areaCm2: number;
  color: string;
  bgRgba: string;
}

export interface SpecimenPatch {
  id: string;
  patchNum: string;
  boxTargetId?: string;
  classType: 'LC' | 'PB' | 'DC' | 'DCA';
  symbol: string;
  name: string;
  confidence: string;
  areaCm2: number;
  imageUrl: string;
  altText: string;
  color: string;
}

export const SPECIMEN_BOUNDING_BOXES: SpecimenBoundingBox[] = [
  {
    id: 'box-1',
    boxNum: '#01',
    top: '14%',
    left: '18%',
    width: '28%',
    height: '32%',
    classType: 'LC',
    symbol: '■',
    label: '[LC]',
    benthicClass: 'Live Coral',
    confidence: '94.2%',
    areaCm2: 142,
    color: '#F2637A',
    bgRgba: 'rgba(242, 99, 122, 0.14)',
  },
  {
    id: 'box-2',
    boxNum: '#02',
    top: '28%',
    left: '52%',
    width: '34%',
    height: '30%',
    classType: 'PB',
    symbol: '◇',
    label: '[PB]',
    benthicClass: 'Bleached Coral',
    confidence: '81.4%',
    areaCm2: 210,
    color: '#E8A93C',
    bgRgba: 'rgba(232, 169, 60, 0.14)',
  },
  {
    id: 'box-3',
    boxNum: '#03',
    top: '58%',
    left: '12%',
    width: '24%',
    height: '26%',
    classType: 'LC',
    symbol: '■',
    label: '[LC]',
    benthicClass: 'Live Coral',
    confidence: '88.6%',
    areaCm2: 95,
    color: '#F2637A',
    bgRgba: 'rgba(242, 99, 122, 0.14)',
  },
  {
    id: 'box-4',
    boxNum: '#04',
    top: '64%',
    left: '44%',
    width: '20%',
    height: '20%',
    classType: 'DC',
    symbol: '✕',
    label: '[DC]',
    benthicClass: 'Dead Coral',
    confidence: '76.1%',
    areaCm2: 68,
    color: '#8B8378',
    bgRgba: 'rgba(139, 131, 120, 0.16)',
  },
  {
    id: 'box-5',
    boxNum: '#05',
    top: '52%',
    left: '68%',
    width: '26%',
    height: '32%',
    classType: 'DCA',
    symbol: '▤',
    label: '[DCA]',
    benthicClass: 'Turf Algae Colonized',
    confidence: '89.5%',
    areaCm2: 185,
    color: '#6B7A3A',
    bgRgba: 'rgba(107, 122, 58, 0.16)',
  },
];

export const SPECIMEN_PATCHES: SpecimenPatch[] = [
  {
    id: 'p-01',
    patchNum: 'P-01',
    boxTargetId: 'box-1',
    classType: 'LC',
    symbol: '■',
    name: 'Live Branching Coral',
    confidence: '94.2%',
    areaCm2: 142,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6CCgUsll0dnl_kHfKH3U5PcQPdbs1_gZ2TpVmU-3u3Al7VAFeYcA2R5iQ2XwRlgO8Uy03_g0RGMCno6TE2FTwMyOcoT7ZCqLthDg2JHK9iYwzwqGeliZ26J_wmlIKpOfz3tb0fkbpBSGRZ_3gGHATkngueFV45pemcOPh1fGrmvGfiYlvHZ52gft7G39q51PuDkbDWe9VwtNmGECsgE3Dp3ddENLeP2UlXxJvtWEPMyVZJjmrdzpg',
    altText:
      'Close-up crop of branching salmon pink live coral corallites under clear reef water.',
    color: '#F2637A',
  },
  {
    id: 'p-02',
    patchNum: 'P-02',
    boxTargetId: 'box-2',
    classType: 'PB',
    symbol: '◇',
    name: 'Bleached Massive Coral',
    confidence: '81.4%',
    areaCm2: 210,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDMrBEDjPgy8SxdMV2xiVQ9hAZdxu-fUJ87x1tbsHdosp88WotvRY_L5zS9UWdUt5S6U4wcWwjZ6AkgdQbkBCSJZIE2mSk6hqFE_s74fRpSUtiEOVUF2WgqJ9iRONML-n3CyQEP7HN9h4NrIWPi9_rA2D8Oiq75n3kM3FUj-pAK1PuYlm6969BmuIfpt0J4w5I_f1vtiIGCKcf0cnxB4ATbpMotHGl166Lcoxeh-WOjJ2vxXG4sk4lU',
    altText:
      'Macro view of massive mounding coral colony displaying pale amber bleached margin.',
    color: '#E8A93C',
  },
  {
    id: 'p-03',
    patchNum: 'P-03',
    boxTargetId: 'box-3',
    classType: 'LC',
    symbol: '■',
    name: 'Live Digitate Coral',
    confidence: '88.6%',
    areaCm2: 95,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6Kw90uHuBNHYk0bDfJFRprIPX4nvln3WsQSJzq7d1dipOSsO8RtNmU_uUq7rXNcjuCiEMvCC12bgKn5_ikFpq2kC5jJHZ2xjlPmdAV29PVb63LhqSvP-NXlypa4_uWMO_5vWCFhU-s-dZ2UNMhs_V3yfDn4wUIzNEvOPaP3m5aVNnMY9UooM4rJ9DVIDkbr0k8_vBt2EJ_5_bburcYGE5y00y6GEpWtUa9mkBlAd0_4Zjase-qQjy',
    altText:
      'Close-up view of digitate finger branches showing healthy pigmented polyps.',
    color: '#F2637A',
  },
  {
    id: 'p-04',
    patchNum: 'P-04',
    boxTargetId: 'box-4',
    classType: 'DC',
    symbol: '✕',
    name: 'Dead Coral Skeleton',
    confidence: '76.1%',
    areaCm2: 68,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAcK0rBZI0RxXx8xwYa1ZEB6h7wXdJNroQAP0u7EQmvUFLfdv1DOFOYY3K5Sf2x9-bJtAzw2UkgYn9n_LXGQcl7fAMMH6pNDAsHLkNwm7CPIDFUFvuT8ZjggTvzhvcsk7OenUHfHWD_BJPi_OvEoqS49GpOq1jq7UXCr4NKb-DRRUqQvg967FCWvDiwA8b7VIrsnjxzLoE0mLFRgQZdIUuRsv7RqvGfRpL3I1KGcPx-dnGobYOKKy_0',
    altText:
      'Survey photo of dead skeletal calcified framework with bare bone-grey eroded surface.',
    color: '#8B8378',
  },
  {
    id: 'p-05',
    patchNum: 'P-05',
    boxTargetId: 'box-5',
    classType: 'DCA',
    symbol: '▤',
    name: 'Turf Algae Colonization',
    confidence: '89.5%',
    areaCm2: 185,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA1fA1xqSIYjn8U_5jeixg_AeNSBuECH5YE7jKQd1G0KrV_TnFO4adD4jxpVkpC9FJVPrI_-KJkLxdVwZCgUth6SMH-x4h5T4On_r60OK4tKHghN_5_X_UAvrkuk1VQSy_B9uj4UVsJ7Tie06QgqBhFxlFZuxeDo_A3DzhUb21caH4Wwnh2POzAV_fd-KgPd_4TxCs7NVLTNnzOBkhUGLjct4P5pFSycZ03tc14l4Ib4XU-4LfyZTpw',
    altText:
      'Filamentous algal turf mat coating dead coral substrate on benthic reef pavement.',
    color: '#6B7A3A',
  },
  {
    id: 'p-06',
    patchNum: 'P-06',
    classType: 'PB',
    symbol: '◇',
    name: 'Bleached Tabular Coral',
    confidence: '84.0%',
    areaCm2: 110,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDHqnxj_1hABt0TqhjBAdKV2cpGXjCVAkjW7AbkyHfhBbgQBubYvQxB13e6KGbb46nifAVo8yUqgwWKIm6sDMk703YBkzoMFupbVNE4djlVGLd2O7RGclXnQbviVJiVjVP4WtSQHGRPCQ2u4u6Owrz7aNSUh5zob_2-Xt46U1eVkuE9RJVHlFrqt2pOkXIiAywbsoyLKCSQa4_oketSwHHJDJkwZTXMlXDGGh_nbcaKwsrpendyIxSW',
    altText:
      'Tabular coral plate margin showing bleached amber yellow edge with reticulate structure.',
    color: '#E8A93C',
  },
  {
    id: 'p-07',
    patchNum: 'P-07',
    classType: 'LC',
    symbol: '■',
    name: 'Live Branching Cluster',
    confidence: '91.2%',
    areaCm2: 78,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6CCgUsll0dnl_kHfKH3U5PcQPdbs1_gZ2TpVmU-3u3Al7VAFeYcA2R5iQ2XwRlgO8Uy03_g0RGMCno6TE2FTwMyOcoT7ZCqLthDg2JHK9iYwzwqGeliZ26J_wmlIKpOfz3tb0fkbpBSGRZ_3gGHATkngueFV45pemcOPh1fGrmvGfiYlvHZ52gft7G39q51PuDkbDWe9VwtNmGECsgE3Dp3ddENLeP2UlXxJvtWEPMyVZJjmrdzpg',
    altText: 'Vibrant cluster of live coral with intact pigment.',
    color: '#F2637A',
  },
  {
    id: 'p-08',
    patchNum: 'P-08',
    classType: 'LC',
    symbol: '■',
    name: 'Live Massive Colony',
    confidence: '93.5%',
    areaCm2: 160,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDMrBEDjPgy8SxdMV2xiVQ9hAZdxu-fUJ87x1tbsHdosp88WotvRY_L5zS9UWdUt5S6U4wcWwjZ6AkgdQbkBCSJZIE2mSk6hqFE_s74fRpSUtiEOVUF2WgqJ9iRONML-n3CyQEP7HN9h4NrIWPi9_rA2D8Oiq75n3kM3FUj-pAK1PuYlm6969BmuIfpt0J4w5I_f1vtiIGCKcf0cnxB4ATbpMotHGl166Lcoxeh-WOjJ2vxXG4sk4lU',
    altText: 'Dense massive dome of live coral in healthy condition.',
    color: '#F2637A',
  },
  {
    id: 'p-09',
    patchNum: 'P-09',
    classType: 'LC',
    symbol: '■',
    name: 'Live Digitate Colony',
    confidence: '89.4%',
    areaCm2: 115,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6Kw90uHuBNHYk0bDfJFRprIPX4nvln3WsQSJzq7d1dipOSsO8RtNmU_uUq7rXNcjuCiEMvCC12bgKn5_ikFpq2kC5jJHZ2xjlPmdAV29PVb63LhqSvP-NXlypa4_uWMO_5vWCFhU-s-dZ2UNMhs_V3yfDn4wUIzNEvOPaP3m5aVNnMY9UooM4rJ9DVIDkbr0k8_vBt2EJ_5_bburcYGE5y00y6GEpWtUa9mkBlAd0_4Zjase-qQjy',
    altText: 'Stout finger-like branches of live coral.',
    color: '#F2637A',
  },
  {
    id: 'p-10',
    patchNum: 'P-10',
    classType: 'LC',
    symbol: '■',
    name: 'Live Encrusting Colony',
    confidence: '92.1%',
    areaCm2: 88,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6CCgUsll0dnl_kHfKH3U5PcQPdbs1_gZ2TpVmU-3u3Al7VAFeYcA2R5iQ2XwRlgO8Uy03_g0RGMCno6TE2FTwMyOcoT7ZCqLthDg2JHK9iYwzwqGeliZ26J_wmlIKpOfz3tb0fkbpBSGRZ_3gGHATkngueFV45pemcOPh1fGrmvGfiYlvHZ52gft7G39q51PuDkbDWe9VwtNmGECsgE3Dp3ddENLeP2UlXxJvtWEPMyVZJjmrdzpg',
    altText: 'Honeycomb corallites of healthy encrusting coral.',
    color: '#F2637A',
  },
  {
    id: 'p-11',
    patchNum: 'P-11',
    classType: 'LC',
    symbol: '■',
    name: 'Live Meandroid Colony',
    confidence: '95.0%',
    areaCm2: 130,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDMrBEDjPgy8SxdMV2xiVQ9hAZdxu-fUJ87x1tbsHdosp88WotvRY_L5zS9UWdUt5S6U4wcWwjZ6AkgdQbkBCSJZIE2mSk6hqFE_s74fRpSUtiEOVUF2WgqJ9iRONML-n3CyQEP7HN9h4NrIWPi9_rA2D8Oiq75n3kM3FUj-pAK1PuYlm6969BmuIfpt0J4w5I_f1vtiIGCKcf0cnxB4ATbpMotHGl166Lcoxeh-WOjJ2vxXG4sk4lU',
    altText: 'Meandering valleys of healthy brain coral colony.',
    color: '#F2637A',
  },
  {
    id: 'p-12',
    patchNum: 'P-12',
    classType: 'LC',
    symbol: '■',
    name: 'Live Submassive Head',
    confidence: '90.3%',
    areaCm2: 92,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6Kw90uHuBNHYk0bDfJFRprIPX4nvln3WsQSJzq7d1dipOSsO8RtNmU_uUq7rXNcjuCiEMvCC12bgKn5_ikFpq2kC5jJHZ2xjlPmdAV29PVb63LhqSvP-NXlypa4_uWMO_5vWCFhU-s-dZ2UNMhs_V3yfDn4wUIzNEvOPaP3m5aVNnMY9UooM4rJ9DVIDkbr0k8_vBt2EJ_5_bburcYGE5y00y6GEpWtUa9mkBlAd0_4Zjase-qQjy',
    altText: 'Submassive colony of healthy live coral.',
    color: '#F2637A',
  },
  {
    id: 'p-13',
    patchNum: 'P-13',
    classType: 'LC',
    symbol: '■',
    name: 'Live Branching Cluster',
    confidence: '93.8%',
    areaCm2: 105,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6CCgUsll0dnl_kHfKH3U5PcQPdbs1_gZ2TpVmU-3u3Al7VAFeYcA2R5iQ2XwRlgO8Uy03_g0RGMCno6TE2FTwMyOcoT7ZCqLthDg2JHK9iYwzwqGeliZ26J_wmlIKpOfz3tb0fkbpBSGRZ_3gGHATkngueFV45pemcOPh1fGrmvGfiYlvHZ52gft7G39q51PuDkbDWe9VwtNmGECsgE3Dp3ddENLeP2UlXxJvtWEPMyVZJjmrdzpg',
    altText: 'Delicate corallites of live coral with healthy polyps.',
    color: '#F2637A',
  },
  {
    id: 'p-14',
    patchNum: 'P-14',
    classType: 'LC',
    symbol: '■',
    name: 'Live Foliose Colony',
    confidence: '87.9%',
    areaCm2: 124,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDMrBEDjPgy8SxdMV2xiVQ9hAZdxu-fUJ87x1tbsHdosp88WotvRY_L5zS9UWdUt5S6U4wcWwjZ6AkgdQbkBCSJZIE2mSk6hqFE_s74fRpSUtiEOVUF2WgqJ9iRONML-n3CyQEP7HN9h4NrIWPi9_rA2D8Oiq75n3kM3FUj-pAK1PuYlm6969BmuIfpt0J4w5I_f1vtiIGCKcf0cnxB4ATbpMotHGl166Lcoxeh-WOjJ2vxXG4sk4lU',
    altText: 'Foliose whorls of healthy plate coral.',
    color: '#F2637A',
  },
  {
    id: 'p-15',
    patchNum: 'P-15',
    classType: 'LC',
    symbol: '■',
    name: 'Live Branching Tips',
    confidence: '91.7%',
    areaCm2: 82,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6Kw90uHuBNHYk0bDfJFRprIPX4nvln3WsQSJzq7d1dipOSsO8RtNmU_uUq7rXNcjuCiEMvCC12bgKn5_ikFpq2kC5jJHZ2xjlPmdAV29PVb63LhqSvP-NXlypa4_uWMO_5vWCFhU-s-dZ2UNMhs_V3yfDn4wUIzNEvOPaP3m5aVNnMY9UooM4rJ9DVIDkbr0k8_vBt2EJ_5_bburcYGE5y00y6GEpWtUa9mkBlAd0_4Zjase-qQjy',
    altText: 'Club-shaped branch tips of live coral.',
    color: '#F2637A',
  },
  {
    id: 'p-16',
    patchNum: 'P-16',
    classType: 'LC',
    symbol: '■',
    name: 'Live Fine Branch Colony',
    confidence: '94.6%',
    areaCm2: 64,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6CCgUsll0dnl_kHfKH3U5PcQPdbs1_gZ2TpVmU-3u3Al7VAFeYcA2R5iQ2XwRlgO8Uy03_g0RGMCno6TE2FTwMyOcoT7ZCqLthDg2JHK9iYwzwqGeliZ26J_wmlIKpOfz3tb0fkbpBSGRZ_3gGHATkngueFV45pemcOPh1fGrmvGfiYlvHZ52gft7G39q51PuDkbDWe9VwtNmGECsgE3Dp3ddENLeP2UlXxJvtWEPMyVZJjmrdzpg',
    altText: 'Delicate branching coral structure in good health.',
    color: '#F2637A',
  },
  {
    id: 'p-17',
    patchNum: 'P-17',
    classType: 'PB',
    symbol: '◇',
    name: 'Bleached Branching Colony',
    confidence: '82.5%',
    areaCm2: 98,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDHqnxj_1hABt0TqhjBAdKV2cpGXjCVAkjW7AbkyHfhBbgQBubYvQxB13e6KGbb46nifAVo8yUqgwWKIm6sDMk703YBkzoMFupbVNE4djlVGLd2O7RGclXnQbviVJiVjVP4WtSQHGRPCQ2u4u6Owrz7aNSUh5zob_2-Xt46U1eVkuE9RJVHlFrqt2pOkXIiAywbsoyLKCSQa4_oketSwHHJDJkwZTXMlXDGGh_nbcaKwsrpendyIxSW',
    altText: 'Partially bleached pale branch colony.',
    color: '#E8A93C',
  },
  {
    id: 'p-18',
    patchNum: 'P-18',
    classType: 'PB',
    symbol: '◇',
    name: 'Bleached Foliose Margin',
    confidence: '79.8%',
    areaCm2: 145,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDMrBEDjPgy8SxdMV2xiVQ9hAZdxu-fUJ87x1tbsHdosp88WotvRY_L5zS9UWdUt5S6U4wcWwjZ6AkgdQbkBCSJZIE2mSk6hqFE_s74fRpSUtiEOVUF2WgqJ9iRONML-n3CyQEP7HN9h4NrIWPi9_rA2D8Oiq75n3kM3FUj-pAK1PuYlm6969BmuIfpt0J4w5I_f1vtiIGCKcf0cnxB4ATbpMotHGl166Lcoxeh-WOjJ2vxXG4sk4lU',
    altText: 'Plate margin coral exhibiting pale bleaching.',
    color: '#E8A93C',
  },
  {
    id: 'p-19',
    patchNum: 'P-19',
    classType: 'DC',
    symbol: '✕',
    name: 'Dead Skeletal Pavement',
    confidence: '83.2%',
    areaCm2: 112,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAcK0rBZI0RxXx8xwYa1ZEB6h7wXdJNroQAP0u7EQmvUFLfdv1DOFOYY3K5Sf2x9-bJtAzw2UkgYn9n_LXGQcl7fAMMH6pNDAsHLkNwm7CPIDFUFvuT8ZjggTvzhvcsk7OenUHfHWD_BJPi_OvEoqS49GpOq1jq7UXCr4NKb-DRRUqQvg967FCWvDiwA8b7VIrsnjxzLoE0mLFRgQZdIUuRsv7RqvGfRpL3I1KGcPx-dnGobYOKKy_0',
    altText: 'Weathered bare calcium carbonate skeleton of ancient coral head.',
    color: '#8B8378',
  },
];
