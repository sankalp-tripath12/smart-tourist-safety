import {
  verifyAuditChain,
  getAuditRecords,
  getAuditRecordById,
} from "../services/auditLedger.service.js";

export async function fetchAuditRecords(req, res) {
  try {
    const { limit, offset, eventType } = req.query;
    const data = await getAuditRecords({ limit, offset, eventType });
    return res.status(200).json({
      success: true,
      total: data.total,
      count: data.records.length,
      data: data.records,
    });
  } catch (error) {
    console.error("Fetch audit records error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve audit ledger records",
    });
  }
}

export async function runChainVerification(req, res) {
  try {
    const result = await verifyAuditChain();
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error("Audit chain verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify audit ledger integrity",
    });
  }
}

export async function fetchAuditRecordById(req, res) {
  try {
    const record = await getAuditRecordById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Audit record not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("Fetch audit record error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve audit record",
    });
  }
}
