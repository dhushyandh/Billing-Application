import Settings from '../models/Settings.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import { calculateAndValidateInvoice } from './gstValidation.js';

export async function seedDatabase() {
  const existingSettings = await Settings.findOne();
  if (existingSettings) return;

  console.log('Seeding initial IJAZ TRADERS data...');

  const settings = await Settings.create({
    name: 'IJAZ TRADERS',
    address:
      'NO. 49/4A/7A, N H MAIN ROAD, GOVERNMENT SCHOOL,\nTHIMMASAMUTHIRAM, KANCHEEPURAM,\nKANCHEEPURAM DT- 631502',
    gstin: '33BTNPM5744E1ZK',
    stateName: 'Tamil Nadu',
    stateCode: '33',
    contact: '9843988337',
    email: 'ijaztradersbvm@gmail.com',
    bankDetails: {
      accountHolderName: 'IJAZ TRADERS',
      bankName: 'AXIS BANK',
      accountNo: '923020047217197',
      branchAndIfsc: 'KANCHIPURAM & UTIB0000534',
      swiftCode: '',
    },
    declaration:
      'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    numbering: {
      taxInvoicePrefix: 'INV-',
      taxInvoiceNext: 373,
      proformaPrefix: '',
      proformaNext: 373,
      creditNotePrefix: 'CN-',
      creditNoteNext: 1,
    },
  });

  const customers = await Customer.insertMany([
    {
      name: 'PATTAMMALMANI TRADERS',
      address: 'NO.11/91,A, ANNA NAGAR\nPOLIPAKKAM',
      phone: '9843777433',
      email: '',
      isRegistered: true,
      gstin: '33CEEPK1872G2ZN',
      stateCode: '33',
      stateName: 'Tamil Nadu',
    },
    {
      name: 'SRI MURUGAN HARDWARE & STEELS',
      address: '45, GANDHI ROAD, VELLORE\nTAMIL NADU - 632001',
      phone: '9842100456',
      email: 'srimurugan@example.com',
      isRegistered: true,
      gstin: '33AABCS1429B1Z5',
      stateCode: '33',
      stateName: 'Tamil Nadu',
    },
    {
      name: 'BANGALORE FENCING SOLUTIONS',
      address: 'PLOT 18, PEENYA INDUSTRIAL AREA\nBENGALURU, KARNATAKA - 560058',
      phone: '9900112233',
      email: 'blr.fencing@example.com',
      isRegistered: true,
      gstin: '29AAACB2894G1Z9',
      stateCode: '29',
      stateName: 'Karnataka',
    },
  ]);

  const products = await Product.insertMany([
    {
      name: 'TATA WIRON KNOTTED FENCE 5FEET AAYUSH 15/5/6 100 FT',
      sku: 'TW-KF-5FT',
      subDescription: '17 ROLL',
      category: 'Knotted Fencing',
      description: 'High-tensile galvanized knotted wire fence, 5ft height, 100ft per roll (500 SQFT/roll). Ideal for agricultural & estate perimeter security.',
      hsnSac: '7217',
      unit: 'SQFT',
      purchasePrice: 10.5,
      rate: 12.54,
      rateInclTax: 14.8,
      isTaxInclusive: false,
      gstRate: 18,
      stockQty: 25000,
      isVisibleOnStorefront: true,
      isFeatured: true,
      inStock: true,
    },
    {
      name: 'VNC FENCING POST',
      sku: 'VNC-FP-7FT',
      subDescription: '7 FEET - 150 NOS',
      category: 'Fencing Posts',
      description: 'Heavy-duty 7ft VNC fencing post engineered for long-lasting structural support in all soil conditions.',
      hsnSac: '7314',
      unit: 'NOS',
      purchasePrice: 495.0,
      rate: 580.51,
      rateInclTax: 685.0,
      isTaxInclusive: false,
      gstRate: 18,
      stockQty: 500,
      isVisibleOnStorefront: true,
      isFeatured: true,
      inStock: true,
    },
    {
      name: 'VNC FENCING POST (SIDE POST)',
      sku: 'VNC-SP-01',
      subDescription: 'SIDE POST - 10 NOS',
      category: 'Fencing Posts',
      description: 'Reinforced VNC corner & side support post for tensioning knotted and barbed wire fencing.',
      hsnSac: '7314',
      unit: 'NOS',
      purchasePrice: 440.0,
      rate: 512.71,
      rateInclTax: 605.0,
      isTaxInclusive: false,
      gstRate: 18,
      stockQty: 200,
      isVisibleOnStorefront: true,
      isFeatured: false,
      inStock: true,
    },
    {
      name: 'TATA GI WIRE 1.60MM',
      sku: 'TATA-GI-160',
      subDescription: '1 ROLL',
      category: 'GI Wire',
      description: 'Corrosion-resistant 1.60mm Tata Galvanized Iron binding and tension wire.',
      hsnSac: '7217',
      unit: 'KGS',
      purchasePrice: 112.0,
      rate: 131.36,
      rateInclTax: 155.0,
      isTaxInclusive: false,
      gstRate: 18,
      stockQty: 1000,
      isVisibleOnStorefront: true,
      isFeatured: true,
      inStock: true,
    },
  ]);

  const samplePayloads = [
    {
      documentType: 'Proforma Invoice',
      invoiceNumber: '372',
      invoiceDate: '2026-11-11',
      status: 'Pending',
      buyer: {
        customerId: customers[0]._id,
        name: customers[0].name,
        address: customers[0].address,
        phone: customers[0].phone,
        isRegistered: true,
        gstin: customers[0].gstin,
        stateCode: customers[0].stateCode,
      },
      dispatchDetails: {
        modeOfPayment: 'IMMEDIATE',
        buyersOrderNo: 'BY MOBILE',
        buyersOrderDate: '11-Nov-26',
        dispatchedThrough: 'BY ROAD',
        destination: 'POLIPAKKAM',
        billOfLadingNo: '372 dt. 11-Nov-26',
        termsOfDelivery: '20 NOV 26',
      },
      items: [
        {
          productId: products[0]._id,
          description: 'TATA WIRON KNOTTED FENCE 5FEET AAYUSH 15/5/6 100 FT',
          subDescription: '17 ROLL',
          hsnSac: '7217',
          quantity: 8500,
          unit: 'SQFT',
          rateInclTax: 14.8,
          rate: 12.54,
          gstRate: 18,
        },
        {
          productId: products[1]._id,
          description: 'VNC FENCING POST',
          subDescription: '7 FEET - 150 NOS',
          hsnSac: '7314',
          quantity: 150,
          unit: 'NOS',
          rateInclTax: 685.0,
          rate: 580.51,
          gstRate: 18,
        },
        {
          productId: products[2]._id,
          description: 'VNC FENCING POST',
          subDescription: 'SIDE POST - 10 NOS',
          hsnSac: '7314',
          quantity: 10,
          unit: 'NOS',
          rateInclTax: 605.0,
          rate: 512.71,
          gstRate: 18,
        },
        {
          productId: products[3]._id,
          description: 'TATA GI WIRE 1.60MM',
          subDescription: '1 ROLL',
          hsnSac: '7217',
          quantity: 25,
          unit: 'KGS',
          rateInclTax: 155.0,
          rate: 131.36,
          gstRate: 18,
        },
      ],
    },
    {
      documentType: 'Tax Invoice',
      invoiceNumber: 'INV-371',
      invoiceDate: '2026-11-05',
      status: 'Paid',
      buyer: {
        customerId: customers[1]._id,
        name: customers[1].name,
        address: customers[1].address,
        phone: customers[1].phone,
        isRegistered: true,
        gstin: customers[1].gstin,
        stateCode: customers[1].stateCode,
      },
      dispatchDetails: {
        modeOfPayment: 'NEFT / RTGS',
        dispatchedThrough: 'BY ROAD',
        destination: 'VELLORE',
        termsOfDelivery: 'DELIVERED',
      },
      items: [
        {
          productId: products[1]._id,
          description: 'VNC FENCING POST',
          subDescription: '7 FEET - 100 NOS',
          hsnSac: '7314',
          quantity: 100,
          unit: 'NOS',
          rate: 580.51,
          gstRate: 18,
        },
        {
          productId: products[3]._id,
          description: 'TATA GI WIRE 1.60MM',
          subDescription: '4 ROLLS',
          hsnSac: '7217',
          quantity: 100,
          unit: 'KGS',
          rate: 131.36,
          gstRate: 18,
        },
      ],
    },
    {
      documentType: 'Tax Invoice',
      invoiceNumber: 'INV-372',
      invoiceDate: '2026-11-09',
      status: 'Paid',
      buyer: {
        customerId: customers[2]._id,
        name: customers[2].name,
        address: customers[2].address,
        phone: customers[2].phone,
        isRegistered: true,
        gstin: customers[2].gstin,
        stateCode: customers[2].stateCode,
      },
      dispatchDetails: {
        modeOfPayment: 'IMMEDIATE',
        dispatchedThrough: 'VRL LOGISTICS',
        destination: 'BENGALURU',
        motorVehicleNo: 'KA01AB4521',
        termsOfDelivery: 'F.O.R BENGALURU',
      },
      items: [
        {
          productId: products[0]._id,
          description: 'TATA WIRON KNOTTED FENCE 5FEET AAYUSH 15/5/6 100 FT',
          subDescription: '10 ROLLS',
          hsnSac: '7217',
          quantity: 5000,
          unit: 'SQFT',
          rate: 12.54,
          gstRate: 18,
        },
      ],
    },
  ];

  for (const payload of samplePayloads) {
    const result = calculateAndValidateInvoice(payload, settings.toObject());
    if (result.valid) {
      await Invoice.create(result.data);
    } else {
      console.error('Seed validation error:', result.errors);
    }
  }

  console.log('Seed complete.');
}

