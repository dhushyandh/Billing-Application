import { formatINR, formatInvoiceDate } from '../utils/gst.js';

export default function InvoicePreview({ invoice }) {
  if (!invoice) return null;
  const isIntra = invoice.supplyType === 'INTRA';
  const d = invoice.dispatchDetails || {};
  const bank = invoice.seller?.bankDetails || {};

  // Group tax rates for display like "CGST 9%" / "SGST 9%" when uniform, or generic when mixed
  const uniqueRates = [...new Set((invoice.items || []).map((i) => i.gstRate))];
  const singleRate = uniqueRates.length === 1 ? uniqueRates[0] : null;

  return (
    <div className="print-only-container mx-auto max-w-[210mm] bg-white p-4 sm:p-6 text-black border border-slate-300 shadow-sm text-[11px] leading-tight font-sans">
      {/* Document Title */}
      <div className="text-center font-bold text-sm tracking-wide uppercase pb-2">
        {invoice.documentType || 'TAX INVOICE'}
      </div>

      {/* Main Outer Border */}
      <div className="border border-black">
        {/* Top Header Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-black">
          {/* Left Column: Seller & Buyer */}
          <div className="md:border-r border-black flex flex-col">
            {/* Seller */}
            <div className="p-2 border-b border-black flex items-start gap-2.5">
              {invoice.seller?.showLogo !== false && invoice.seller?.logoUrl && (
                <img
                  src={invoice.seller.logoUrl}
                  alt="Logo"
                  className="h-12 w-12 object-contain shrink-0 border border-slate-200 p-0.5"
                />
              )}
              <div>
                <div className="font-bold text-xs uppercase">{invoice.seller?.name || 'IJAZ TRADERS'}</div>
                <div className="whitespace-pre-line">{invoice.seller?.address}</div>
                <div>GSTIN/UIN: {invoice.seller?.gstin}</div>
                <div>
                  State Name : {invoice.seller?.stateName}, Code : {invoice.seller?.stateCode}
                </div>
                {invoice.seller?.contact && <div>Contact : {invoice.seller.contact}</div>}
                {invoice.seller?.email && <div>E-Mail : {invoice.seller.email}</div>}
              </div>
            </div>

            {/* Buyer */}
            <div className="p-2 flex-1">
              <div className="text-[10px] text-slate-700">Buyer (Bill to)</div>
              <div className="font-bold text-xs uppercase mt-0.5">{invoice.buyer?.name}</div>
              <div className="whitespace-pre-line">{invoice.buyer?.address}</div>
              {invoice.buyer?.phone && <div>{invoice.buyer.phone}</div>}
              <div className="mt-0.5">
                <span className="inline-block w-24">GSTIN/UIN</span>:{' '}
                {invoice.buyer?.isRegistered ? invoice.buyer?.gstin : 'Unregistered'}
              </div>
              <div>
                <span className="inline-block w-24">State Name</span>:{' '}
                {invoice.buyer?.stateName}, Code : {invoice.buyer?.stateCode}
              </div>
            </div>
          </div>

          {/* Right Column: Metadata 2-col Grid */}
          <div className="grid grid-cols-2 text-[10px]">
            <div className="border-r border-b border-black p-1.5">
              <div className="flex justify-between text-slate-700">
                <span>Invoice No.</span>
                <span>e-Way Bill No.</span>
              </div>
              <div className="font-bold text-[11px] mt-0.5">
                {invoice.invoiceNumber}
                {invoice.eWayBillNo ? `   ${invoice.eWayBillNo}` : ''}
              </div>
            </div>
            <div className="border-b border-black p-1.5">
              <div className="text-slate-700">Dated</div>
              <div className="font-bold text-[11px] mt-0.5">
                {formatInvoiceDate(invoice.invoiceDate)}
              </div>
            </div>

            <div className="border-r border-b border-black p-1.5">
              <div className="text-slate-700">Delivery Note</div>
              <div className="font-bold mt-0.5 min-h-[14px]">{d.deliveryNote || ''}</div>
            </div>
            <div className="border-b border-black p-1.5">
              <div className="text-slate-700">Mode/Terms of Payment</div>
              <div className="font-bold mt-0.5 min-h-[14px]">{d.modeOfPayment || ''}</div>
            </div>

            <div className="border-r border-b border-black p-1.5">
              <div className="text-slate-700">Reference No. &amp; Date.</div>
              <div className="font-bold mt-0.5 min-h-[14px]">{d.referenceNoAndDate || ''}</div>
            </div>
            <div className="border-b border-black p-1.5">
              <div className="text-slate-700">Other References</div>
              <div className="font-bold mt-0.5 min-h-[14px]">{d.otherReferences || ''}</div>
            </div>

            <div className="border-r border-b border-black p-1.5">
              <div className="text-slate-700">Buyer&apos;s Order No.</div>
              <div className="font-bold mt-0.5 min-h-[14px]">{d.buyersOrderNo || ''}</div>
            </div>
            <div className="border-b border-black p-1.5">
              <div className="text-slate-700">Dated</div>
              <div className="font-bold mt-0.5 min-h-[14px]">{d.buyersOrderDate || ''}</div>
            </div>

            <div className="border-r border-b border-black p-1.5">
              <div className="text-slate-700">Dispatch Doc No.</div>
              <div className="font-bold mt-0.5 min-h-[14px]">{d.dispatchDocNo || ''}</div>
            </div>
            <div className="border-b border-black p-1.5">
              <div className="text-slate-700">Delivery Note Date</div>
              <div className="font-bold mt-0.5 min-h-[14px]">{d.deliveryNoteDate || ''}</div>
            </div>

            <div className="border-r border-b border-black p-1.5">
              <div className="text-slate-700">Dispatched through</div>
              <div className="font-bold mt-0.5 min-h-[14px]">{d.dispatchedThrough || ''}</div>
            </div>
            <div className="border-b border-black p-1.5">
              <div className="text-slate-700">Destination</div>
              <div className="font-bold mt-0.5 min-h-[14px]">{d.destination || ''}</div>
            </div>

            <div className="border-r border-b border-black p-1.5">
              <div className="text-slate-700">Bill of Lading/LR-RR No.</div>
              <div className="font-bold mt-0.5 min-h-[14px]">{d.billOfLadingNo || ''}</div>
            </div>
            <div className="border-b border-black p-1.5">
              <div className="text-slate-700">Motor Vehicle No.</div>
              <div className="font-bold mt-0.5 min-h-[14px]">{d.motorVehicleNo || ''}</div>
            </div>

            <div className="col-span-2 p-1.5 min-h-[34px]">
              <div className="text-slate-700">Terms of Delivery</div>
              <div className="font-bold mt-0.5">{d.termsOfDelivery || ''}</div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-black bg-slate-50/70">
                <th className="border-r border-black px-1.5 py-1.5 text-center w-9 font-normal">
                  Sl<br />No.
                </th>
                <th className="border-r border-black px-2 py-1.5 text-center font-normal">
                  Description of Goods
                </th>
                <th className="border-r border-black px-1.5 py-1.5 text-center w-16 font-normal">
                  HSN/SAC
                </th>
                <th className="border-r border-black px-2 py-1.5 text-center w-24 font-normal">
                  Quantity
                </th>
                <th className="border-r border-black px-2 py-1.5 text-center w-20 font-normal">
                  Rate<br />
                  <span className="text-[9px]">(Incl. of Tax)</span>
                </th>
                <th className="border-r border-black px-2 py-1.5 text-center w-16 font-normal">
                  Rate
                </th>
                <th className="border-r border-black px-1.5 py-1.5 text-center w-12 font-normal">
                  per
                </th>
                <th className="px-2 py-1.5 text-center w-24 font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, idx) => (
                <tr key={idx} className="align-top">
                  <td className="border-r border-black px-1.5 py-1 text-center">{idx + 1}</td>
                  <td className="border-r border-black px-2 py-1">
                    <div className="font-bold uppercase">{item.description}</div>
                    {item.subDescription && (
                      <div className="italic text-[10px] pl-3">{item.subDescription}</div>
                    )}
                    {item.discountPercent > 0 && (
                      <div className="text-[9px] text-slate-600 pl-3">
                        Discount: {item.discountPercent}% (-₹{formatINR(item.discountAmount)})
                      </div>
                    )}
                  </td>
                  <td className="border-r border-black px-1.5 py-1 text-center">{item.hsnSac}</td>
                  <td className="border-r border-black px-2 py-1 text-right font-bold whitespace-nowrap">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="border-r border-black px-2 py-1 text-right">
                    {formatINR(item.rateInclTax)}
                  </td>
                  <td className="border-r border-black px-2 py-1 text-right">
                    {formatINR(item.rate)}
                  </td>
                  <td className="border-r border-black px-1.5 py-1 text-center">{item.unit}</td>
                  <td className="px-2 py-1 text-right font-bold">
                    {formatINR(item.taxableValue)}
                  </td>
                </tr>
              ))}

              {/* Spacer + Subtotal */}
              <tr>
                <td className="border-r border-black py-2" />
                <td className="border-r border-black py-2" />
                <td className="border-r border-black py-2" />
                <td className="border-r border-black py-2" />
                <td className="border-r border-black py-2" />
                <td className="border-r border-black py-2" />
                <td className="border-r border-black py-2" />
                <td className="border-t border-black px-2 py-1 text-right font-semibold">
                  {formatINR(invoice.totals?.subtotalTaxable)}
                </td>
              </tr>

              {/* Tax Rows */}
              {isIntra ? (
                <>
                  <tr>
                    <td className="border-r border-black" />
                    <td className="border-r border-black px-2 py-0.5 text-right font-bold italic">
                      CGST {singleRate !== null ? `${singleRate / 2}%` : ''}
                    </td>
                    <td className="border-r border-black" />
                    <td className="border-r border-black" />
                    <td className="border-r border-black" />
                    <td className="border-r border-black px-2 py-0.5 text-right">
                      {singleRate !== null ? singleRate / 2 : ''}
                    </td>
                    <td className="border-r border-black px-1.5 py-0.5 text-center">
                      {singleRate !== null ? '%' : ''}
                    </td>
                    <td className="px-2 py-0.5 text-right font-bold">
                      {formatINR(invoice.totals?.totalCgst)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-r border-black" />
                    <td className="border-r border-black px-2 py-0.5 text-right font-bold italic">
                      SGST {singleRate !== null ? `${singleRate / 2}%` : ''}
                    </td>
                    <td className="border-r border-black" />
                    <td className="border-r border-black" />
                    <td className="border-r border-black" />
                    <td className="border-r border-black px-2 py-0.5 text-right">
                      {singleRate !== null ? singleRate / 2 : ''}
                    </td>
                    <td className="border-r border-black px-1.5 py-0.5 text-center">
                      {singleRate !== null ? '%' : ''}
                    </td>
                    <td className="px-2 py-0.5 text-right font-bold">
                      {formatINR(invoice.totals?.totalSgst)}
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td className="border-r border-black" />
                  <td className="border-r border-black px-2 py-0.5 text-right font-bold italic">
                    IGST {singleRate !== null ? `${singleRate}%` : ''}
                  </td>
                  <td className="border-r border-black" />
                  <td className="border-r border-black" />
                  <td className="border-r border-black" />
                  <td className="border-r border-black px-2 py-0.5 text-right">
                    {singleRate !== null ? singleRate : ''}
                  </td>
                  <td className="border-r border-black px-1.5 py-0.5 text-center">
                    {singleRate !== null ? '%' : ''}
                  </td>
                  <td className="px-2 py-0.5 text-right font-bold">
                    {formatINR(invoice.totals?.totalIgst)}
                  </td>
                </tr>
              )}

              {/* Round Off */}
              <tr>
                <td className="border-r border-black" />
                <td className="border-r border-black px-2 py-0.5 text-right font-bold italic">
                  ROUND OFF
                </td>
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td className="px-2 py-0.5 text-right font-bold">
                  {formatINR(invoice.totals?.roundOff)}
                </td>
              </tr>

              {/* Grand Total */}
              <tr className="border-t border-b border-black">
                <td className="border-r border-black" />
                <td className="border-r border-black px-2 py-1.5 text-right">Total</td>
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td className="border-r border-black" />
                <td className="px-2 py-1.5 text-right font-bold text-xs whitespace-nowrap">
                  ₹ {formatINR(invoice.totals?.grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in Words */}
        <div className="px-2 py-1.5 border-b border-black">
          <div className="flex justify-between text-[10px]">
            <span>Amount Chargeable (in words)</span>
            <span className="italic">E. &amp; O.E</span>
          </div>
          <div className="font-bold text-[11px] mt-0.5">{invoice.amountInWords}</div>
        </div>

        {/* HSN/SAC Summary Table */}
        <div className="overflow-x-auto border-b border-black">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-black bg-slate-50/70">
                <th rowSpan={2} className="border-r border-black px-2 py-1 text-center font-normal">
                  HSN/SAC
                </th>
                <th rowSpan={2} className="border-r border-black px-2 py-1 text-right font-normal">
                  Taxable<br />Value
                </th>
                {isIntra ? (
                  <>
                    <th colSpan={2} className="border-r border-b border-black px-2 py-0.5 text-center font-normal">
                      CGST
                    </th>
                    <th colSpan={2} className="border-r border-b border-black px-2 py-0.5 text-center font-normal">
                      SGST/UTGST
                    </th>
                  </>
                ) : (
                  <th colSpan={2} className="border-r border-b border-black px-2 py-0.5 text-center font-normal">
                    IGST
                  </th>
                )}
                <th rowSpan={2} className="px-2 py-1 text-right font-normal">
                  Total<br />Tax Amount
                </th>
              </tr>
              <tr className="border-b border-black bg-slate-50/70">
                {isIntra ? (
                  <>
                    <th className="border-r border-black px-1.5 py-0.5 text-right font-normal">Rate</th>
                    <th className="border-r border-black px-1.5 py-0.5 text-right font-normal">Amount</th>
                    <th className="border-r border-black px-1.5 py-0.5 text-right font-normal">Rate</th>
                    <th className="border-r border-black px-1.5 py-0.5 text-right font-normal">Amount</th>
                  </>
                ) : (
                  <>
                    <th className="border-r border-black px-1.5 py-0.5 text-right font-normal">Rate</th>
                    <th className="border-r border-black px-1.5 py-0.5 text-right font-normal">Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {(invoice.hsnSummary || []).map((h, i) => (
                <tr key={i} className="border-b border-slate-300">
                  <td className="border-r border-black px-2 py-0.5 text-left">{h.hsnSac}</td>
                  <td className="border-r border-black px-2 py-0.5 text-right">
                    {formatINR(h.taxableValue)}
                  </td>
                  {isIntra ? (
                    <>
                      <td className="border-r border-black px-1.5 py-0.5 text-right">{h.cgstRate}%</td>
                      <td className="border-r border-black px-1.5 py-0.5 text-right">
                        {formatINR(h.cgstAmount)}
                      </td>
                      <td className="border-r border-black px-1.5 py-0.5 text-right">{h.sgstRate}%</td>
                      <td className="border-r border-black px-1.5 py-0.5 text-right">
                        {formatINR(h.sgstAmount)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border-r border-black px-1.5 py-0.5 text-right">{h.igstRate}%</td>
                      <td className="border-r border-black px-1.5 py-0.5 text-right">
                        {formatINR(h.igstAmount)}
                      </td>
                    </>
                  )}
                  <td className="px-2 py-0.5 text-right">{formatINR(h.totalTaxAmount)}</td>
                </tr>
              ))}
              <tr className="font-bold border-t border-black">
                <td className="border-r border-black px-2 py-1 text-right">Total</td>
                <td className="border-r border-black px-2 py-1 text-right">
                  {formatINR(invoice.totals?.subtotalTaxable)}
                </td>
                {isIntra ? (
                  <>
                    <td className="border-r border-black px-1.5 py-1" />
                    <td className="border-r border-black px-1.5 py-1 text-right">
                      {formatINR(invoice.totals?.totalCgst)}
                    </td>
                    <td className="border-r border-black px-1.5 py-1" />
                    <td className="border-r border-black px-1.5 py-1 text-right">
                      {formatINR(invoice.totals?.totalSgst)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border-r border-black px-1.5 py-1" />
                    <td className="border-r border-black px-1.5 py-1 text-right">
                      {formatINR(invoice.totals?.totalIgst)}
                    </td>
                  </>
                )}
                <td className="px-2 py-1 text-right">{formatINR(invoice.totals?.totalTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tax Amount in Words */}
        <div className="px-2 py-1.5 text-[10px]">
          <span>Tax Amount (in words) : </span>
          <span className="font-bold text-[11px]">{invoice.taxAmountInWords}</span>
        </div>

        {/* Footer: Declaration, Bank Details & Signature */}
        <div className="grid grid-cols-1 md:grid-cols-12 pt-2">
          <div className="md:col-span-5 p-2 flex flex-col justify-end space-y-2">
            {invoice.seller?.termsAndConditions && (
              <div>
                <div className="underline text-[10px] mb-0.5">Terms &amp; Conditions</div>
                <div className="text-[9px] leading-snug whitespace-pre-line">
                  {invoice.seller.termsAndConditions}
                </div>
              </div>
            )}
            <div>
              <div className="underline text-[10px] mb-0.5">Declaration</div>
              <div className="text-[10px] leading-snug">{invoice.declaration}</div>
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col justify-between">
            {invoice.seller?.showBankDetails !== false && (
              <div className="p-2 text-[10px]">
                <div className="mb-0.5">Company&apos;s Bank Details</div>
                <div className="grid grid-cols-12 gap-y-0.5">
                  <div className="col-span-5">A/c Holder&apos;s Name</div>
                  <div className="col-span-7 font-bold">: {bank.accountHolderName}</div>
                  <div className="col-span-5">Bank Name</div>
                  <div className="col-span-7 font-bold">: {bank.bankName}</div>
                  <div className="col-span-5">A/c No.</div>
                  <div className="col-span-7 font-bold">: {bank.accountNo}</div>
                  <div className="col-span-5">Branch &amp; IFS Code</div>
                  <div className="col-span-7 font-bold">
                    : {bank.branchAndIfsc || `${bank.branchName || ''} & ${bank.ifscCode || ''}`}
                  </div>
                  <div className="col-span-5">SWIFT Code</div>
                  <div className="col-span-7 font-bold">: {bank.swiftCode || ''}</div>
                </div>
              </div>
            )}

            <div className="border-t border-l border-black p-2 text-right min-h-[60px] flex flex-col justify-between items-end">
              <div className="font-bold text-[10px]">for {invoice.seller?.name || 'IJAZ TRADERS'}</div>
              {invoice.seller?.signatureUrl && (
                <img
                  src={invoice.seller.signatureUrl}
                  alt="Authorised Signatory"
                  className="h-9 object-contain my-1"
                />
              )}
              <div className="text-[10px] pt-1">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] mt-1.5">This is a Computer Generated Invoice</div>
    </div>
  );
}

