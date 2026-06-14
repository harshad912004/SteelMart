const BidCostDetailModel = require('../models/bidCostDetailModel');
const BidModel = require('../models/bidModel');
const PDFDocument = require('pdfkit');
const transporter = require('../../common/utils/sendMail');
const { sendSuccess, sendError } = require('../../common/utils/apiResponse');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const normalizeBidId = (value) => {
    const bidId = Number(value);
    return Number.isInteger(bidId) && bidId > 0 ? bidId : null;
};

const normalizeAmount = (value) => {
    if (value === undefined || value === null || value === '') { return 0; }
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
};

const normalizeItemId = (value) => {
    const itemId = Number(value);
    return Number.isInteger(itemId) && itemId > 0 ? itemId : null;
};

const normalizeCostItems = (body = {}) => {
    if (Array.isArray(body.items)) {
        return body.items.map((item, index) => ({
            id: normalizeItemId(item?.id ?? item?.item_id),
            item: item?.item || `Item ${index + 1}`,
            description: item?.description || '',
            quantity: normalizeAmount(item?.quantity ?? item?.qty),
            rate: normalizeAmount(item?.rate),
            price: normalizeAmount(item?.price)
        }));
    }

    const descriptions = Array.isArray(body.description) ? body.description : [];
    const quantities = Array.isArray(body.quantity) ? body.quantity : Array.isArray(body.qty) ? body.qty : [];
    const rates = Array.isArray(body.rate) ? body.rate : [];
    const prices = Array.isArray(body.price) ? body.price : [];
    const itemNames = Array.isArray(body.item) ? body.item : [];
    const itemIds = Array.isArray(body.id) ? body.id : Array.isArray(body.item_id) ? body.item_id : [];
    const itemCount = Math.max(descriptions.length, quantities.length, rates.length, prices.length, itemNames.length, itemIds.length);

    return Array.from({ length: itemCount }, (_, index) => ({
        id: normalizeItemId(itemIds[index]),
        item: itemNames[index] || `Item ${index + 1}`,
        description: descriptions[index] || '',
        quantity: normalizeAmount(quantities[index]),
        rate: normalizeAmount(rates[index]),
        price: normalizeAmount(prices[index])
    }));
};

const buildCostPayload = (body = {}) => {
    const items = normalizeCostItems(body);
    const sanitizedItems = items.filter((item) => item.item || item.description || item.quantity || item.rate || item.price);
    const derivedSubTotal = sanitizedItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.rate) || 0)), 0);
    const subTotal = derivedSubTotal;
    const grandTotal = subTotal;

    return {
        items: sanitizedItems,
        sub_total: subTotal,
        grand_total: grandTotal
    };
};

const extractEstimateData = (details = []) => {
    if (!Array.isArray(details) || details.length === 0) {
        return {
            items: [],
            sub_total: 0,
            grand_total: 0
        };
    }

    if (details.length === 1 && Array.isArray(details[0]?.items)) {
        return {
            items: [],
            sub_total: normalizeAmount(details[0].sub_total),
            grand_total: normalizeAmount(details[0].grand_total)
        };
    }

    return {
        items: details,
        sub_total: normalizeAmount(details[0]?.sub_total),
        grand_total: normalizeAmount(details[0]?.grand_total)
    };
};

const ensureSavedEstimateExists = async (bidId, res) => {
    const hasSavedEstimate = await BidCostDetailModel.hasSavedCostDetails(bidId);
    if (!hasSavedEstimate) {
        sendError(res, 400, 'Save estimate cost details before using preview, download, or send');
        return false;
    }

    return true;
};

const buildEstimatePDFBuffer = (bid, estimate) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    generatePDFContent(doc, bid, estimate);
    doc.end();
});

const generatePDFContent = (doc, bid, estimate) => {
    const items = Array.isArray(estimate?.items) ? estimate.items : [];
    const subTotal = normalizeAmount(estimate?.sub_total);
    const grandTotal = normalizeAmount(estimate?.grand_total);

    doc.fontSize(20).text('Estimate', { align: 'center' });
    doc.moveDown();

    if (bid) {
        doc.fontSize(12).text(`Project Name: ${bid.project_name || 'N/A'}`);
        doc.text(`Address: ${bid.address || 'N/A'}`);
        doc.text(`Due Date: ${bid.due_date ? new Date(bid.due_date).toLocaleDateString() : 'N/A'}`);
        doc.moveDown();
    }

    doc.fontSize(10).font('Helvetica-Bold');
    const startY = doc.y;
    doc.text('Item', 50, startY);
    doc.text('Description', 150, startY);
    doc.text('QTY', 350, startY);
    doc.text('Rate', 400, startY);
    doc.text('Price', 480, startY);

    doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();
    doc.font('Helvetica');

    let currentY = startY + 20;

    if (items.length > 0) {
        items.forEach((item) => {
            doc.text(item.item || '', 50, currentY);
            doc.text(item.description || '', 150, currentY, { width: 190 });
            doc.text((item.quantity ?? item.qty ?? 0).toString(), 350, currentY);
            doc.text(`$${normalizeAmount(item.rate).toFixed(2)}`, 400, currentY);
            doc.text(`$${normalizeAmount(item.price).toFixed(2)}`, 480, currentY);
            currentY += 20;
        });

        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
        currentY += 10;

        doc.font('Helvetica-Bold');
        doc.text('Sub Total:', 400, currentY);
        doc.text(`$${subTotal.toFixed(2)}`, 480, currentY);

        currentY += 20;

        doc.text('Grand Total:', 400, currentY);
        doc.text(`$${grandTotal.toFixed(2)}`, 480, currentY);
    } else {
        doc.text('No cost details available.', 50, currentY);
        currentY += 30;
        doc.font('Helvetica-Bold');
        doc.text('Sub Total:', 400, currentY);
        doc.text(`$${subTotal.toFixed(2)}`, 480, currentY);
        currentY += 20;
        doc.text('Grand Total:', 400, currentY);
        doc.text(`$${grandTotal.toFixed(2)}`, 480, currentY);
    }
};

const getCostDetails = async (req, res, next) => {
    try {
        const bidId = normalizeBidId(req.params.id);
        if (!bidId) { return sendError(res, 400, 'Valid bid id is required'); }

        const details = await BidCostDetailModel.getCostDetailsByBidId(bidId);
        const estimate = extractEstimateData(details);
        const hasSavedEstimate = await BidCostDetailModel.hasSavedCostDetails(bidId);

        return sendSuccess(res, 'Cost details fetched successfully', {
            is_saved: hasSavedEstimate,
            items: estimate.items,
            sub_total: estimate.sub_total,
            grand_total: estimate.grand_total
        });
    } catch (error) {
        next(error);
    }
};

const saveCostDetails = async (req, res, next) => {
    try {
        const bidId = normalizeBidId(req.params.id);
        if (!bidId) { return sendError(res, 400, 'Valid bid id is required'); }

        const bid = await BidModel.getBidById(bidId);
        if (!bid) { return sendError(res, 404, 'Bid not found'); }

        const created_by = req.user?.id;
        if (!created_by) { return sendError(res, 401, 'Unable to resolve user identity'); }

        const payload = buildCostPayload(req.body);
        const savedEstimate = await BidCostDetailModel.saveCostDetails(bidId, payload, created_by);

        // The bid status is now defaulted to bidInProgress, so no need to update it here.

        return sendSuccess(res, 'Cost details saved successfully', {
            is_saved: true,
            items: savedEstimate.items,
            sub_total: savedEstimate.sub_total,
            grand_total: savedEstimate.grand_total,
            bid_value: savedEstimate.grand_total
        });
    } catch (error) {
        next(error);
    }
};

const previewEstimatePDF = async (req, res, next) => {
    try {
        const bidId = normalizeBidId(req.params.id);
        if (!bidId) { return sendError(res, 400, 'Valid bid id is required'); }
        if (!await ensureSavedEstimateExists(bidId, res)) { return; }

        const bid = await BidModel.getBidById(bidId);
        if (!bid) { return sendError(res, 404, 'Bid not found'); }

        const details = await BidCostDetailModel.getCostDetailsByBidId(bidId);
        const estimate = extractEstimateData(details);
        const pdfBuffer = await buildEstimatePDFBuffer(bid, estimate);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.status(200).end(pdfBuffer);
    } catch (error) {
        next(error);
    }
};

const downloadEstimatePDF = async (req, res, next) => {
    try {
        const bidId = normalizeBidId(req.params.id);
        if (!bidId) { return sendError(res, 400, 'Valid bid id is required'); }
        if (!await ensureSavedEstimateExists(bidId, res)) { return; }

        const bid = await BidModel.getBidById(bidId);
        if (!bid) { return sendError(res, 404, 'Bid not found'); }

        const details = await BidCostDetailModel.getCostDetailsByBidId(bidId);
        const estimate = extractEstimateData(details);
        const pdfBuffer = await buildEstimatePDFBuffer(bid, estimate);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="estimate-${bidId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.status(200).end(pdfBuffer);
    } catch (error) {
        next(error);
    }
};

const sendEstimatePDF = async (req, res, next) => {
    try {
        const bidId = normalizeBidId(req.params.id);
        if (!bidId) { return sendError(res, 400, 'Valid bid id is required'); }
        if (!await ensureSavedEstimateExists(bidId, res)) { return; }

        // Accept a single email or an array of emails
        const rawEmails = req.body?.emails || req.body?.email || req.body?.recipient_email;
        const emailList = (Array.isArray(rawEmails) ? rawEmails : [rawEmails])
            .map((e) => String(e || '').trim())
            .filter((e) => EMAIL_REGEX.test(e));

        if (emailList.length === 0) {
            return sendError(res, 400, 'At least one valid email address is required');
        }

        // Accept a single company_id or an array of company_ids
        const rawCompanyIds = req.body?.company_ids || req.body?.company_id;
        const companyIdList = (Array.isArray(rawCompanyIds) ? rawCompanyIds : [rawCompanyIds])
            .map((id) => normalizeBidId(id))
            .filter(Boolean);

        const bid = await BidModel.getBidById(bidId);
        if (!bid) { return sendError(res, 404, 'Bid not found'); }

        const details = await BidCostDetailModel.getCostDetailsByBidId(bidId);
        const estimate = extractEstimateData(details);

        // Build PDF once and reuse the buffer for all recipients
        const pdfBuffer = await buildEstimatePDFBuffer(bid, estimate);

        // Send to all recipients in parallel
        const mailResults = await Promise.allSettled(
            emailList.map((email) =>
                transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: `Estimate for Project: ${bid.project_name || bidId}`,
                    text: 'Please find the attached estimate.',
                    attachments: [{ filename: `estimate-${bidId}.pdf`, content: pdfBuffer }],
                })
            )
        );

        const failed = mailResults.filter((r) => r.status === 'rejected');

        // Update bid status only once — use first valid company_id, or fall back to first associated client
        let targetCompanyIds = [...companyIdList];
        if (targetCompanyIds.length === 0 && Array.isArray(bid.clients) && bid.clients.length > 0) {
            targetCompanyIds = [bid.clients[0].client_id];
        }

        if (targetCompanyIds.length > 0) {
            await BidModel.updateBid(bidId, {
                send_to_ids: targetCompanyIds.join(','),
                status: 'sentToClient'
            });
        }

        if (failed.length === emailList.length) {
            const updatedBid = await BidModel.getBidById(bidId);
            return sendSuccess(res, 'Bid marked as sent, but emails could not be delivered', { bid: updatedBid });
        }

        const updatedBid = await BidModel.getBidById(bidId);
        const sentCount = emailList.length - failed.length;
        const message = failed.length > 0
            ? `Estimate sent to ${sentCount} of ${emailList.length} recipients (${failed.length} failed)`
            : `Estimate sent successfully to ${sentCount} recipient${sentCount > 1 ? 's' : ''}`;

        return sendSuccess(res, message, { bid: updatedBid });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCostDetails,
    saveCostDetails,
    previewEstimatePDF,
    downloadEstimatePDF,
    sendEstimatePDF
};
