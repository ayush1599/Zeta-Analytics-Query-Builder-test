import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageFooter } from "@/components/PageFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Database, Cloud, Server, Settings, Network, ArrowRightLeft, Layers, CloudUpload, Snowflake, CalendarIcon, Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

type Operation = "ZIGS" | "Data Transfer";
type DataSource = "Hive" | "S3" | "Snowflake";
type IdentityType = "cookie_sizmek" | "ip_v4" | "email_md5" | "crm_bsin" | "maid_maid" | "email_sha256";
type FileType = "csv" | "csv.gz";

const ZigsDataTransfer = () => {
  const navigate = useNavigate();
  const [operation, setOperation] = useState<Operation | "">("");
  const [source, setSource] = useState<DataSource | "">("");
  const [destination, setDestination] = useState<DataSource | "">("");

  // ZIGS Source configuration fields
  const [sourceTableName, setSourceTableName] = useState("");
  const [sourceS3Location, setSourceS3Location] = useState("");
  const [sourceQuery, setSourceQuery] = useState(""); // New: Query field for ZIGS Hive
  const [inputType, setInputType] = useState<IdentityType | "">("");
  const [outputType, setOutputType] = useState<IdentityType | "">("");

  // ZIGS Destination configuration fields
  const [destTableName, setDestTableName] = useState("");
  const [destS3Bucket, setDestS3Bucket] = useState(""); // S3 destination bucket
  const [destS3Key, setDestS3Key] = useState("");
  const [snowflakeRole, setSnowflakeRole] = useState("");
  const [snowflakeDestTable, setSnowflakeDestTable] = useState("");

  // ZIGS S3 custom bucket fields
  const [zigsSourceS3Bucket, setZigsSourceS3Bucket] = useState("");
  const [zigsSourceCustomBucket, setZigsSourceCustomBucket] = useState("");
  const [zigsSourceAccessKey, setZigsSourceAccessKey] = useState("");
  const [zigsSourceSecretKey, setZigsSourceSecretKey] = useState("");
  const [zigsDestCustomBucket, setZigsDestCustomBucket] = useState("");
  const [zigsDestAccessKey, setZigsDestAccessKey] = useState("");
  const [zigsDestSecretKey, setZigsDestSecretKey] = useState("");

  // Data Transfer Source configuration fields
  const [dtSourceTableName, setDtSourceTableName] = useState("");
  const [dtSourceS3Bucket, setDtSourceS3Bucket] = useState(""); // Changed: Split from S3 Location
  const [dtSourceS3Key, setDtSourceS3Key] = useState(""); // Changed: Split from S3 Location
  const [dtSourceFileType, setDtSourceFileType] = useState<FileType | "">("");
  const [dtSourceColumn, setDtSourceColumn] = useState("");
  const [dtSourceQuery, setDtSourceQuery] = useState("");

  // Data Transfer Destination configuration fields
  const [dtDestTableName, setDtDestTableName] = useState("");
  const [dtDestS3Bucket, setDtDestS3Bucket] = useState(""); // Changed: Split from S3 Location
  const [dtDestS3Key, setDtDestS3Key] = useState(""); // Changed: Split from S3 Location
  const [dtDestOverwrite, setDtDestOverwrite] = useState(false);
  const [dtDestSnowflakeRole, setDtDestSnowflakeRole] = useState(""); // Snowflake role for Data Transfer

  // S3 bucket custom fields
  const [dtSourceCustomBucket, setDtSourceCustomBucket] = useState("");
  const [dtSourceAccessKey, setDtSourceAccessKey] = useState("");
  const [dtSourceSecretKey, setDtSourceSecretKey] = useState("");
  const [dtDestCustomBucket, setDtDestCustomBucket] = useState("");
  const [dtDestAccessKey, setDtDestAccessKey] = useState("");
  const [dtDestSecretKey, setDtDestSecretKey] = useState("");

  // Dialog and requester email state
  const [showRequesterDialog, setShowRequesterDialog] = useState(false);
  const [requesterEmail, setRequesterEmail] = useState("");
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionSuccess, setExecutionSuccess] = useState(false);

  // ZIGS additional fields
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [campaignIds, setCampaignIds] = useState("");
  const [scheme, setScheme] = useState<string>("");

  // Get available source options based on operation
  const getSourceOptions = (): DataSource[] => {
    switch (operation) {
      case "ZIGS":
        return ["Hive", "S3"];
      case "Data Transfer":
        return ["Hive", "S3", "Snowflake"];
      default:
        return [];
    }
  };

  // Get available destination options based on operation and source
  const getDestinationOptions = (): DataSource[] => {
    switch (operation) {
      case "ZIGS":
        if (source === "Hive") return ["Hive", "S3", "Snowflake"];
        if (source === "S3") return ["Hive", "S3", "Snowflake"];
        break;
      case "Data Transfer":
        return ["Hive", "S3", "Snowflake"].filter(option => option !== source);
      default:
        return [];
    }
    return [];
  };

  // Identity type options
  const identityTypes: IdentityType[] = ["cookie_sizmek", "ip_v4", "email_md5", "crm_bsin", "maid_maid", "email_sha256"];

  // Get available output types (excluding the selected input type)
  const getAvailableOutputTypes = (): IdentityType[] => {
    if (!inputType) return identityTypes;
    return identityTypes.filter(type => type !== inputType);
  };

  // File type options
  const fileTypes: FileType[] = ["csv", "csv.gz"];

  // S3 bucket options
  const s3BucketOptions = ["zeta-pgmt-ds", "zeta-dcp-prod-integrations", "custom"];

  // Helper functions to check if custom bucket is selected (Data Transfer)
  const isSourceCustomBucket = () => {
    return dtSourceS3Bucket === "custom" || (dtSourceS3Bucket && !s3BucketOptions.slice(0, 2).includes(dtSourceS3Bucket));
  };

  const isDestCustomBucket = () => {
    return dtDestS3Bucket === "custom" || (dtDestS3Bucket && !s3BucketOptions.slice(0, 2).includes(dtDestS3Bucket));
  };

  // Get the actual bucket name to use (Data Transfer)
  const getActualSourceBucket = () => {
    return isSourceCustomBucket() ? dtSourceCustomBucket : dtSourceS3Bucket;
  };

  const getActualDestBucket = () => {
    return isDestCustomBucket() ? dtDestCustomBucket : dtDestS3Bucket;
  };

  // Helper functions for ZIGS S3 custom bucket
  const isZigsSourceCustomBucket = () => {
    return zigsSourceS3Bucket === "custom" || (zigsSourceS3Bucket && !s3BucketOptions.slice(0, 2).includes(zigsSourceS3Bucket));
  };

  const isZigsDestCustomBucket = () => {
    return destS3Bucket === "custom" || (destS3Bucket && !s3BucketOptions.slice(0, 2).includes(destS3Bucket));
  };

  const getActualZigsSourceBucket = () => {
    return isZigsSourceCustomBucket() ? zigsSourceCustomBucket : zigsSourceS3Bucket;
  };

  const getActualZigsDestBucket = () => {
    return isZigsDestCustomBucket() ? zigsDestCustomBucket : destS3Bucket;
  };

  // Helper functions to strip bucket prefix from S3 keys
  const stripBucketPrefix = (s3Key: string, bucket: string | undefined): string => {
    if (!bucket || !s3Key) return s3Key;
    // If the s3Key starts with "bucket/", remove it
    const prefix = `${bucket}/`;
    if (s3Key.startsWith(prefix)) {
      return s3Key.substring(prefix.length);
    }
    return s3Key;
  };

  // Reset source and destination when operation changes
  useEffect(() => {
    const sourceOptions = getSourceOptions();
    const destOptions = getDestinationOptions();

    // Reset source if current source is not available
    if (source && !sourceOptions.includes(source as DataSource)) {
      setSource("");
      // Reset ZIGS source-specific fields
      setSourceTableName("");
      setSourceS3Location("");
      setSourceQuery("");
      setInputType("");
      setOutputType("");
      // Reset Data Transfer source-specific fields
      setDtSourceTableName("");
      setDtSourceS3Bucket("");
      setDtSourceS3Key("");
      setDtSourceFileType("");
      setDtSourceColumn("");
      setDtSourceQuery("");
    }

    // Reset destination if current destination is not available
    if (destination && !destOptions.includes(destination as DataSource)) {
      setDestination("");
      // Reset ZIGS destination-specific fields
      setDestTableName("");
      setDestS3Key("");
      setSnowflakeRole("");
      setSnowflakeDestTable("");
      // Reset Data Transfer destination-specific fields
      setDtDestTableName("");
      setDtDestS3Bucket("");
      setDtDestS3Key("");
      setDtDestOverwrite(false);
    }
  }, [operation, source, destination]);

  // Reset output type if it matches the newly selected input type
  useEffect(() => {
    if (inputType && outputType && inputType === outputType) {
      setOutputType("");
    }
  }, [inputType, outputType]);

  // Auto-populate S3 key fields when bucket is selected
  // ZIGS S3 Source
  useEffect(() => {
    if (zigsSourceS3Bucket && zigsSourceS3Bucket !== 'custom') {
      // Extract the path part after the bucket (if exists)
      const currentPath = sourceS3Location.replace(/^[^/]+\//, '');
      setSourceS3Location(`${zigsSourceS3Bucket}/${currentPath}`);
    } else if (zigsSourceS3Bucket === 'custom') {
      // Clear the field when custom is selected
      setSourceS3Location('');
    }
  }, [zigsSourceS3Bucket]);

  // ZIGS S3 Destination
  useEffect(() => {
    if (destS3Bucket && destS3Bucket !== 'custom') {
      // Extract the path part after the bucket (if exists)
      const currentPath = destS3Key.replace(/^[^/]+\//, '');
      setDestS3Key(`${destS3Bucket}/${currentPath}`);
    } else if (destS3Bucket === 'custom') {
      // Clear the field when custom is selected
      setDestS3Key('');
    }
  }, [destS3Bucket]);

  // Data Transfer S3 Source
  useEffect(() => {
    if (dtSourceS3Bucket && dtSourceS3Bucket !== 'custom') {
      // Extract the path part after the bucket (if exists)
      const currentPath = dtSourceS3Key.replace(/^[^/]+\//, '');
      setDtSourceS3Key(`${dtSourceS3Bucket}/${currentPath}`);
    } else if (dtSourceS3Bucket === 'custom') {
      // Clear the field when custom is selected
      setDtSourceS3Key('');
    }
  }, [dtSourceS3Bucket]);

  // Data Transfer S3 Destination
  useEffect(() => {
    if (dtDestS3Bucket && dtDestS3Bucket !== 'custom') {
      // Extract the path part after the bucket (if exists)
      const currentPath = dtDestS3Key.replace(/^[^/]+\//, '');
      setDtDestS3Key(`${dtDestS3Bucket}/${currentPath}`);
    } else if (dtDestS3Bucket === 'custom') {
      // Clear the field when custom is selected
      setDtDestS3Key('');
    }
  }, [dtDestS3Bucket]);

  const getIcon = (dataSource: DataSource) => {
    switch (dataSource) {
      case "Hive":
        return <Layers className="w-5 h-5 text-white" />;
      case "S3":
        return <CloudUpload className="w-5 h-5 text-white" />;
      case "Snowflake":
        return <Snowflake className="w-5 h-5 text-white" />;
      default:
        return <Database className="w-5 h-5 text-white" />;
    }
  };

  const getDropdownIcon = (dataSource: DataSource) => {
    switch (dataSource) {
      case "Hive":
        return <Layers className="w-5 h-5 text-gray-600" />;
      case "S3":
        return <CloudUpload className="w-5 h-5 text-gray-600" />;
      case "Snowflake":
        return <Snowflake className="w-5 h-5 text-gray-600" />;
      default:
        return <Database className="w-5 h-5 text-gray-600" />;
    }
  };

  // Validation function to check if all required fields are filled
  const isWorkflowValid = (): boolean => {
    if (!operation || !source || !destination) return false;

    if (operation === "ZIGS") {
      // Validate source fields
      if (source === "Hive" && !sourceTableName) return false;
      if (source === "S3") {
        if (!zigsSourceS3Bucket || !sourceS3Location) return false;
        // Validate custom bucket fields if custom bucket is selected
        if (isZigsSourceCustomBucket() && (!zigsSourceCustomBucket || !zigsSourceAccessKey || !zigsSourceSecretKey)) return false;
      }
      if (!inputType || !outputType) return false;

      // Validate destination fields
      // Hive destination auto-generates table name from source, no validation needed
      if (destination === "S3") {
        if (!destS3Bucket || !destS3Key) return false;
        // Validate custom bucket fields if custom bucket is selected
        if (isZigsDestCustomBucket() && (!zigsDestCustomBucket || !zigsDestAccessKey || !zigsDestSecretKey)) return false;
      }
      if (destination === "Snowflake" && (!snowflakeRole || !snowflakeDestTable)) return false;
    }

    if (operation === "Data Transfer") {
      // Validate source fields
      if (source === "Hive" && !dtSourceFileType) return false;
      if (source === "S3") {
        if (!dtSourceS3Bucket || !dtSourceS3Key || !dtSourceFileType) return false;
        // Validate custom bucket fields if custom bucket is selected
        if (isSourceCustomBucket() && (!dtSourceCustomBucket || !dtSourceAccessKey || !dtSourceSecretKey)) return false;
      }
      if (source === "Snowflake" && (!dtSourceTableName || !dtSourceFileType)) return false;

      // Validate destination fields
      if (destination === "Hive" && !dtDestTableName) return false;
      if (destination === "S3") {
        if (!dtDestS3Bucket || !dtDestS3Key) return false;
        // Validate custom bucket fields if custom bucket is selected
        if (isDestCustomBucket() && (!dtDestCustomBucket || !dtDestAccessKey || !dtDestSecretKey)) return false;
      }
      if (destination === "Snowflake" && (!dtDestSnowflakeRole || !dtDestTableName)) return false;
    }

    return true;
  };

  const handleExecuteClick = () => {
    // Open the requester dialog when execute is clicked
    setShowRequesterDialog(true);
  };

  // Helper function to format date to YYYYMMDD
  const formatDateToYYYYMMDD = (date: Date | undefined): string => {
    if (!date) return '';
    return format(date, 'yyyyMMdd');
  };

  const generateInputDict = () => {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Parse comma-separated email into list
    const requestorList = requesterEmail.split(',').map(email => email.trim()).filter(email => email);

    // Format dates to YYYYMMDD
    const formattedStartDate = formatDateToYYYYMMDD(startDate);
    const formattedEndDate = formatDateToYYYYMMDD(endDate);

    if (operation === "ZIGS") {
      // Parse campaign IDs from comma-separated input
      const campaignIdList = campaignIds ? campaignIds.split(',').map(id => id.trim()).filter(id => id) : [];

      // Special format for S3 source to Hive destination (simplified structure)
      if (source === "S3" && destination === "Hive") {
        const zigsSourceBucket = getActualZigsSourceBucket() || 'zeta-dcp-prod-integrations';
        const cleanedSourceLocation = stripBucketPrefix(sourceS3Location || 'tmp/test', zigsSourceBucket);

        const input_dict: any = {
          params: {
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            ids: { campaign_id: campaignIdList },
            request_type: 'zigs',
            requestor: requestorList,
            path: 's3'
          },
          request: {
            zigs: {
              s3_bucket: zigsSourceBucket,
              s3_key: `lookup/dsp-analytics/dasadmin/${cleanedSourceLocation}/dt=${today}/`,
              input_type: inputType ? [inputType] : [],
              output_type: outputType ? [outputType] : [],
              scheme: scheme || 'relaxed-with-liveramp'
            }
          }
        };
        // Add access and secret keys if custom bucket is used
        if (isZigsSourceCustomBucket()) {
          input_dict.request.zigs.access_key = zigsSourceAccessKey;
          input_dict.request.zigs.secret_key = zigsSourceSecretKey;
        }
        return input_dict;
      }

      // Standard format for all other ZIGS combinations
      // Determine path based on source and destination
      let path = "";
      if (source === "Hive" && destination === "Hive") path = "hive-zigs-hive";
      else if (source === "Hive" && destination === "Snowflake") path = "hive-zigs-snowflake";
      else if (source === "Hive" && destination === "S3") path = "hive-s3";
      else if (source === "S3" && destination === "S3") path = "s3";

      // Auto-generate destination table name for Hive
      const autoDestTableName = destination === "Hive" ? `${sourceTableName}_matches` :
        destination === "S3" ? destS3Key :
          snowflakeDestTable;

      const input_dict: any = {
        params: {
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          ids: { campaign_id: campaignIdList },
          request_type: 'zigs',
          requestor: requestorList,
          path: path
        },
        request: {
          data_source: [{
            source_db: 'hive',
            hive_settings: 'SET mapred.job.queue.name=root.dasadmin',
            source_table: sourceTableName,
            source_query: sourceQuery || ''
          }],
          zigs: {
            s3_bucket: 'zeta-dcp-prod-integrations',
            s3_key: `lookup/dsp-analytics/dasadmin/${sourceTableName}/dt=${today}/`,
            input_type: inputType ? [inputType] : [],
            output_type: outputType ? [outputType] : [],
            scheme: scheme || 'relaxed-with-liveramp'
          },
          data_destination: {} as any
        }
      };

      // Build data_destination based on destination type
      if (destination === "Hive") {
        input_dict.request.data_destination.dest_table = autoDestTableName;
        input_dict.request.data_destination.overwrite = 'True';
      } else if (destination === "S3") {
        const zigsDestBucket = getActualZigsDestBucket();
        input_dict.request.data_destination.s3_bucket = zigsDestBucket;
        input_dict.request.data_destination.s3_key = stripBucketPrefix(destS3Key, zigsDestBucket);
        input_dict.request.data_destination.overwrite = 'True';
        // Add access and secret keys if custom bucket is used
        if (isZigsDestCustomBucket()) {
          input_dict.request.data_destination.access_key = zigsDestAccessKey;
          input_dict.request.data_destination.secret_key = zigsDestSecretKey;
        }
      } else if (destination === "Snowflake") {
        input_dict.request.data_destination.sf_role = snowflakeRole;
        input_dict.request.data_destination.dest_table = autoDestTableName;
        input_dict.request.data_destination.overwrite = 'True';
      }

      return input_dict;
    }

    if (operation === "Data Transfer") {
      // Determine request_type and path based on source and destination
      let request_type = "";
      let path = "";

      if (source === "S3") {
        request_type = "s3";
        if (destination === "Hive") path = "s3-hive";
        else if (destination === "Snowflake") path = "s3-snowflake";
      } else if (source === "Hive") {
        request_type = "hive";
        if (destination === "S3") path = "hive-s3";
        else if (destination === "Snowflake") path = "hive-snowflake";
      } else if (source === "Snowflake") {
        request_type = "snowflake";
        if (destination === "S3") path = "snowflake-s3";
        else if (destination === "Hive") path = "snowflake-hive";
      }

      const input_dict: any = {
        params: {
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          request_type: request_type,
          requestor: requestorList,
          path: path
        },
        data_source: {},
        data_destination: {}
      };

      // Build data_source based on source type
      if (source === "S3") {
        const sourceBucket = getActualSourceBucket() || 'zeta-pgmt-ds';
        input_dict.data_source.s3_bucket = sourceBucket;
        input_dict.data_source.s3_location = stripBucketPrefix(dtSourceS3Key || '', sourceBucket);
        // Add access and secret keys if custom bucket is used
        if (isSourceCustomBucket()) {
          input_dict.data_source.access_key = dtSourceAccessKey;
          input_dict.data_source.secret_key = dtSourceSecretKey;
        }
      } else if (source === "Hive") {
        input_dict.data_source.source_query = dtSourceQuery || '';
      } else if (source === "Snowflake") {
        input_dict.data_source.table_or_path = `demo_db.public.${dtSourceTableName}`;
        input_dict.data_source.snowflake_columns = ''; // User should provide this
      }

      input_dict.data_source.file_type = dtSourceFileType?.toLowerCase() || 'csv';

      // Build data_destination based on destination type
      if (destination === "S3") {
        const destBucket = getActualDestBucket();
        const cleanedPath = stripBucketPrefix(dtDestS3Key, destBucket);
        input_dict.data_destination.table_or_path = `s3://${destBucket}/${cleanedPath}`;
        // Add access and secret keys if custom bucket is used
        if (isDestCustomBucket()) {
          input_dict.data_destination.access_key = dtDestAccessKey;
          input_dict.data_destination.secret_key = dtDestSecretKey;
        }
      } else if (destination === "Hive") {
        input_dict.data_destination.table_or_path = dtDestTableName;
      } else if (destination === "Snowflake") {
        input_dict.data_destination.sf_role = dtDestSnowflakeRole;
        input_dict.data_destination.table_or_path = dtDestTableName;
      }

      input_dict.data_destination.overwrite = dtDestOverwrite ? 'True' : 'False';

      return input_dict;
    }

    return {};
  };

  const executeWorkflow = async () => {
    setIsExecuting(true);
    setExecutionError(null);
    setExecutionSuccess(false);

    try {
      const input_dict = generateInputDict();

      // Generate Python format for sending and display
      let jsonStr = JSON.stringify(input_dict, null, 2);
      const queryPlaceholder = '___SOURCE_QUERY_PLACEHOLDER___';
      let sourceQueryValue = '';

      const queryMatch = jsonStr.match(/"source_query":\s*"([^"]*)"/);
      if (queryMatch) {
        sourceQueryValue = queryMatch[1];
        jsonStr = jsonStr.replace(/"source_query":\s*"[^"]*"/, `"source_query": "${queryPlaceholder}"`);
      }

      let pythonFormat = jsonStr
        .replace(/\btrue\b/g, "True")
        .replace(/\bfalse\b/g, "False");

      if (sourceQueryValue) {
        let unescapedQuery = sourceQueryValue
          .replace(/\\n/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '\\"')
          .replace(/\\\\/g, '\\')
          .replace(/\s+/g, ' ');  // Replace multiple spaces with single space

        unescapedQuery = unescapedQuery.trim();
        if (!unescapedQuery.endsWith(';')) {
          unescapedQuery += ';';
        }

        pythonFormat = pythonFormat.replace(`"${queryPlaceholder}"`, `"${unescapedQuery}"`);
      }

      // Display the generated dictionary BEFORE sending to server
      setGeneratedOutput(pythonFormat);

      console.log('=== Sending Workflow Request ===');
      console.log('Input Dictionary:', pythonFormat);

      // Prepare API request
      const apiBaseUrl = import.meta.env.VITE_WORKFLOW_API_BASE_URL || 'https://lsv-vm289.rfiserve.net:5000';
      const apiUrl = import.meta.env.DEV
        ? '/api/json-inputs'  // Development: use Vite proxy
        : `${apiBaseUrl}/json-inputs`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: pythonFormat,
      });

      // Try to parse response as text (same as QueryOutput)
      const resultText = await response.text();

      if (!response.ok) {
        throw new Error(resultText || `Server responded with status ${response.status}`);
      }

      console.log('=== Workflow Response ===');
      console.log(resultText);

      setExecutionSuccess(true);

      // Close dialog and reset fields
      setShowRequesterDialog(false);
      setRequesterEmail("");
      setStartDate(undefined);
      setEndDate(undefined);
      setCampaignIds("");
      setScheme("");

    } catch (error) {
      console.error('=== Workflow Execution Error ===');
      console.error(error);
      setExecutionError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dotted-grid">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="w-full px-0 py-1 relative" style={{ maxWidth: '100vw' }}>
          <div className="flex items-center justify-center relative min-h-[48px]">
            {/* Left: Back to Home */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center pl-4">
              <Button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 hover:text-gray-900 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-4 py-2 font-medium"
                size="sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-400 flex items-center justify-center shadow-md">
                    <ArrowLeft className="w-3 h-3 text-white" />
                  </div>
                  <span>Back to Home</span>
                </div>
              </Button>
            </div>
            {/* Right: Spacer */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-4">
              <div className="w-24"></div> {/* Spacer for centering */}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-7xl">
          {/* Workflow Layout */}
          <div className="flex items-center justify-center mb-16">

            {/* Source Node */}
            <div className={cn("relative z-10 w-80 transition-opacity duration-300", !operation && "opacity-40")}>
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-md border border-blue-500/50">
                      {source ? getIcon(source as DataSource) : <Layers className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Source</h3>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Select
                      value={source}
                      onValueChange={(value: DataSource) => setSource(value)}
                      disabled={!operation}
                    >
                      <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-12 rounded-lg hover:border-gray-300">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {getSourceOptions().map((option) => (
                          <SelectItem key={option} value={option} className="text-gray-800 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              {getDropdownIcon(option)}
                              {option}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic Source Configuration for ZIGS */}
                  {operation === "ZIGS" && source && (
                    <div className="space-y-4 mb-4 animate-in fade-in duration-300">
                      {source === "Hive" && (
                        <>
                          <div>
                            <Label htmlFor="source-table" className="text-sm font-medium text-gray-700 mb-2 block">
                              Table Name
                            </Label>
                            <Input
                              id="source-table"
                              type="text"
                              placeholder="Enter table name"
                              value={sourceTableName}
                              onChange={(e) => setSourceTableName(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                            />
                          </div>
                          <div>
                            <Label htmlFor="source-query" className="text-sm font-medium text-gray-700 mb-2 block">
                              Query
                            </Label>
                            <Textarea
                              id="source-query"
                              placeholder="SELECT * FROM table WHERE..."
                              value={sourceQuery}
                              onChange={(e) => setSourceQuery(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 rounded-lg min-h-[80px]"
                            />
                            <p className="text-xs text-gray-500 mt-1">SQL to subset source data</p>
                          </div>
                        </>
                      )}

                      {source === "S3" && (
                        <>
                          <div>
                            <Label htmlFor="zigs-source-s3-bucket" className="text-sm font-medium text-gray-700 mb-2 block">
                              S3 Bucket
                            </Label>
                            <Select value={zigsSourceS3Bucket} onValueChange={setZigsSourceS3Bucket}>
                              <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg">
                                <SelectValue placeholder="Select S3 bucket" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200">
                                <SelectItem value="zeta-pgmt-ds" className="text-gray-800 hover:bg-gray-50">
                                  zeta-pgmt-ds
                                </SelectItem>
                                <SelectItem value="zeta-dcp-prod-integrations" className="text-gray-800 hover:bg-gray-50">
                                  zeta-dcp-prod-integrations
                                </SelectItem>
                                <SelectItem value="custom" className="text-gray-800 hover:bg-gray-50">
                                  Custom (Enter manually)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {isZigsSourceCustomBucket() && (
                            <>
                              <div>
                                <Label htmlFor="zigs-source-custom-bucket" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Custom Bucket Name
                                </Label>
                                <Input
                                  id="zigs-source-custom-bucket"
                                  type="text"
                                  placeholder="Enter custom bucket name"
                                  value={zigsSourceCustomBucket}
                                  onChange={(e) => setZigsSourceCustomBucket(e.target.value)}
                                  className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                                />
                              </div>
                              <div>
                                <Label htmlFor="zigs-source-access-key" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Access Key
                                </Label>
                                <Input
                                  id="zigs-source-access-key"
                                  type="text"
                                  placeholder="Enter access key"
                                  value={zigsSourceAccessKey}
                                  onChange={(e) => setZigsSourceAccessKey(e.target.value)}
                                  className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                                />
                              </div>
                              <div>
                                <Label htmlFor="zigs-source-secret-key" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Secret Key
                                </Label>
                                <Input
                                  id="zigs-source-secret-key"
                                  type="password"
                                  placeholder="Enter secret key"
                                  value={zigsSourceSecretKey}
                                  onChange={(e) => setZigsSourceSecretKey(e.target.value)}
                                  className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <Label htmlFor="source-s3-location" className="text-sm font-medium text-gray-700 mb-2 block">
                              S3 Key
                            </Label>
                            <Input
                              id="source-s3-location"
                              type="text"
                              placeholder="Eg - 'data_services_data_transfer/tmp'"
                              value={sourceS3Location}
                              onChange={(e) => setSourceS3Location(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <Label htmlFor="input-type" className="text-sm font-medium text-gray-700 mb-2 block">
                          Input Type
                        </Label>
                        <Select value={inputType} onValueChange={(value: IdentityType) => setInputType(value)}>
                          <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg">
                            <SelectValue placeholder="Select input type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            {identityTypes.map((type) => (
                              <SelectItem key={type} value={type} className="text-gray-800 hover:bg-gray-50">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="output-type" className="text-sm font-medium text-gray-700 mb-2 block">
                          Output Type
                        </Label>
                        <Select value={outputType} onValueChange={(value: IdentityType) => setOutputType(value)}>
                          <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg">
                            <SelectValue placeholder="Select output type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            {getAvailableOutputTypes().map((type) => (
                              <SelectItem key={type} value={type} className="text-gray-800 hover:bg-gray-50">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Source Configuration for Data Transfer */}
                  {operation === "Data Transfer" && source && (
                    <div className="space-y-4 mb-4 animate-in fade-in duration-300">
                      {source === "Hive" && (
                        <>
                          <div>
                            <Label htmlFor="dt-source-file-type" className="text-sm font-medium text-gray-700 mb-2 block">
                              File Type
                            </Label>
                            <Select value={dtSourceFileType} onValueChange={(value: FileType) => setDtSourceFileType(value)}>
                              <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg">
                                <SelectValue placeholder="Select file type" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200">
                                {fileTypes.map((type) => (
                                  <SelectItem key={type} value={type} className="text-gray-800 hover:bg-gray-50">
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="dt-source-query" className="text-sm font-medium text-gray-700 mb-2 block">
                              Source Query
                            </Label>
                            <Textarea
                              id="dt-source-query"
                              placeholder="SELECT * FROM table WHERE..."
                              value={dtSourceQuery}
                              onChange={(e) => setDtSourceQuery(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 rounded-lg min-h-[80px]"
                            />
                          </div>
                        </>
                      )}

                      {source === "S3" && (
                        <>
                          <div>
                            <Label htmlFor="dt-source-s3-bucket" className="text-sm font-medium text-gray-700 mb-2 block">
                              S3 Bucket
                            </Label>
                            <Select value={dtSourceS3Bucket} onValueChange={setDtSourceS3Bucket}>
                              <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg">
                                <SelectValue placeholder="Select S3 bucket" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200">
                                <SelectItem value="zeta-pgmt-ds" className="text-gray-800 hover:bg-gray-50">
                                  zeta-pgmt-ds
                                </SelectItem>
                                <SelectItem value="zeta-dcp-prod-integrations" className="text-gray-800 hover:bg-gray-50">
                                  zeta-dcp-prod-integrations
                                </SelectItem>
                                <SelectItem value="custom" className="text-gray-800 hover:bg-gray-50">
                                  Custom (Enter manually)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {isSourceCustomBucket() && (
                            <>
                              <div>
                                <Label htmlFor="dt-source-custom-bucket" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Custom Bucket Name
                                </Label>
                                <Input
                                  id="dt-source-custom-bucket"
                                  type="text"
                                  placeholder="Enter custom bucket name"
                                  value={dtSourceCustomBucket}
                                  onChange={(e) => setDtSourceCustomBucket(e.target.value)}
                                  className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                                />
                              </div>
                              <div>
                                <Label htmlFor="dt-source-access-key" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Access Key
                                </Label>
                                <Input
                                  id="dt-source-access-key"
                                  type="text"
                                  placeholder="Enter access key"
                                  value={dtSourceAccessKey}
                                  onChange={(e) => setDtSourceAccessKey(e.target.value)}
                                  className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                                />
                              </div>
                              <div>
                                <Label htmlFor="dt-source-secret-key" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Secret Key
                                </Label>
                                <Input
                                  id="dt-source-secret-key"
                                  type="password"
                                  placeholder="Enter secret key"
                                  value={dtSourceSecretKey}
                                  onChange={(e) => setDtSourceSecretKey(e.target.value)}
                                  className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <Label htmlFor="dt-source-s3-key" className="text-sm font-medium text-gray-700 mb-2 block">
                              S3 Key
                            </Label>
                            <Input
                              id="dt-source-s3-key"
                              type="text"
                              placeholder="Eg - 'data_services_data_transfer/tmp'"
                              value={dtSourceS3Key}
                              onChange={(e) => setDtSourceS3Key(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dt-source-file-type-s3" className="text-sm font-medium text-gray-700 mb-2 block">
                              File Type
                            </Label>
                            <Select value={dtSourceFileType} onValueChange={(value: FileType) => setDtSourceFileType(value)}>
                              <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg">
                                <SelectValue placeholder="Select file type" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200">
                                {fileTypes.map((type) => (
                                  <SelectItem key={type} value={type} className="text-gray-800 hover:bg-gray-50">
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      {source === "Snowflake" && (
                        <>
                          <div>
                            <Label htmlFor="dt-source-table-sf" className="text-sm font-medium text-gray-700 mb-2 block">
                              Table Name
                            </Label>
                            <Input
                              id="dt-source-table-sf"
                              type="text"
                              placeholder="Enter table name"
                              value={dtSourceTableName}
                              onChange={(e) => setDtSourceTableName(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dt-source-file-type-sf" className="text-sm font-medium text-gray-700 mb-2 block">
                              File Type
                            </Label>
                            <Select value={dtSourceFileType} onValueChange={(value: FileType) => setDtSourceFileType(value)}>
                              <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg">
                                <SelectValue placeholder="Select file type" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200">
                                {fileTypes.map((type) => (
                                  <SelectItem key={type} value={type} className="text-gray-800 hover:bg-gray-50">
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className={cn(
                    "w-3 h-3 rounded-full mx-auto transition-all duration-700",
                    source ? "bg-blue-400 shadow-lg shadow-blue-400/50 animate-pulse" : "bg-blue-300"
                  )}></div>
                </CardContent>
              </Card>
            </div>

            {/* First Connection Line */}
            <div className="relative flex items-center justify-center mx-4">
              <div className={cn(
                "w-32 h-2 transition-all duration-700 rounded-full relative overflow-hidden",
                source && operation ?
                  "bg-gradient-to-r from-blue-400 to-purple-400" :
                  "bg-gradient-to-r from-gray-300 to-gray-400"
              )}>
                {source && operation && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full animate-flow"></div>
                )}
              </div>
            </div>

            {/* Operation Node */}
            <div className="relative z-10 w-80">
              <Card className={cn(
                "bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg hover:shadow-xl transition-all duration-300",
                !operation
                  ? "border-2 border-purple-500 ring-4 ring-purple-200"
                  : "border border-gray-200"
              )}>
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 flex items-center justify-center shadow-md border border-purple-500/50">
                      {operation === "ZIGS" ? (
                        <Network className="w-6 h-6 text-white" />
                      ) : operation === "Data Transfer" ? (
                        <ArrowRightLeft className="w-6 h-6 text-white" />
                      ) : (
                        <Settings className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Operation</h3>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Select value={operation} onValueChange={(value: Operation) => setOperation(value)}>
                      <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-12 rounded-lg hover:border-gray-300">
                        <SelectValue placeholder="Select operation" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="ZIGS" className="text-gray-800 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <Network className="w-4 h-4 text-gray-600" />
                            ZIGS
                          </div>
                        </SelectItem>
                        <SelectItem value="Data Transfer" className="text-gray-800 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <ArrowRightLeft className="w-4 h-4 text-gray-600" />
                            Data Transfer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={cn(
                    "w-3 h-3 rounded-full mx-auto transition-all duration-700",
                    operation ? "bg-purple-400 shadow-lg shadow-purple-400/50 animate-pulse" : "bg-purple-300"
                  )}></div>
                </CardContent>
              </Card>
            </div>

            {/* Second Connection Line */}
            <div className="relative flex items-center justify-center mx-4">
              <div className={cn(
                "w-32 h-2 transition-all duration-700 rounded-full relative overflow-hidden",
                operation && destination ?
                  "bg-gradient-to-r from-purple-400 to-green-400" :
                  "bg-gradient-to-r from-gray-300 to-gray-400"
              )}>
                {operation && destination && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full animate-flow"></div>
                )}
              </div>
            </div>

            {/* Destination Node */}
            <div className={cn("relative z-10 w-80 transition-opacity duration-300", !operation && "opacity-40")}>
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center shadow-md border border-green-500/50">
                      {destination ? getIcon(destination as DataSource) : <Layers className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Destination</h3>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Select
                      value={destination}
                      onValueChange={(value: DataSource) => setDestination(value)}
                      disabled={getDestinationOptions().length === 0}
                    >
                      <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-12 rounded-lg hover:border-gray-300">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {getDestinationOptions().map((option) => (
                          <SelectItem key={option} value={option} className="text-gray-800 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              {getDropdownIcon(option)}
                              {option}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic Destination Configuration for ZIGS */}
                  {operation === "ZIGS" && destination && (
                    <div className="space-y-4 mb-4 animate-in fade-in duration-300">
                      {destination === "Hive" && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-gray-700 mb-1">Destination Table</p>
                          <p className="text-sm text-gray-600">
                            Data will be transferred to: <span className="font-mono font-semibold text-blue-700">
                              {sourceTableName || "[source_table]"}_matches
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-2">Table created automatically based on source table name</p>
                        </div>
                      )}

                      {destination === "S3" && (
                        <>
                          <div>
                            <Label htmlFor="zigs-dest-s3-bucket" className="text-sm font-medium text-gray-700 mb-2 block">
                              S3 Bucket
                            </Label>
                            <Select value={destS3Bucket} onValueChange={setDestS3Bucket}>
                              <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg">
                                <SelectValue placeholder="Select S3 bucket" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200">
                                <SelectItem value="zeta-pgmt-ds" className="text-gray-800 hover:bg-gray-50">
                                  zeta-pgmt-ds
                                </SelectItem>
                                <SelectItem value="zeta-dcp-prod-integrations" className="text-gray-800 hover:bg-gray-50">
                                  zeta-dcp-prod-integrations
                                </SelectItem>
                                <SelectItem value="custom" className="text-gray-800 hover:bg-gray-50">
                                  Custom (Enter manually)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {isZigsDestCustomBucket() && (
                            <>
                              <div>
                                <Label htmlFor="zigs-dest-custom-bucket" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Custom Bucket Name
                                </Label>
                                <Input
                                  id="zigs-dest-custom-bucket"
                                  type="text"
                                  placeholder="Enter custom bucket name"
                                  value={zigsDestCustomBucket}
                                  onChange={(e) => setZigsDestCustomBucket(e.target.value)}
                                  className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                                />
                              </div>
                              <div>
                                <Label htmlFor="zigs-dest-access-key" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Access Key
                                </Label>
                                <Input
                                  id="zigs-dest-access-key"
                                  type="text"
                                  placeholder="Enter access key"
                                  value={zigsDestAccessKey}
                                  onChange={(e) => setZigsDestAccessKey(e.target.value)}
                                  className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                                />
                              </div>
                              <div>
                                <Label htmlFor="zigs-dest-secret-key" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Secret Key
                                </Label>
                                <Input
                                  id="zigs-dest-secret-key"
                                  type="password"
                                  placeholder="Enter secret key"
                                  value={zigsDestSecretKey}
                                  onChange={(e) => setZigsDestSecretKey(e.target.value)}
                                  className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <Label htmlFor="dest-s3-key" className="text-sm font-medium text-gray-700 mb-2 block">
                              S3 Key
                            </Label>
                            <Input
                              id="dest-s3-key"
                              type="text"
                              placeholder="path/to/destination"
                              value={destS3Key}
                              onChange={(e) => setDestS3Key(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                            />
                          </div>
                        </>
                      )}

                      {destination === "Snowflake" && (
                        <>
                          <div>
                            <Label htmlFor="snowflake-role" className="text-sm font-medium text-gray-700 mb-2 block">
                              Role
                            </Label>
                            <Input
                              id="snowflake-role"
                              type="text"
                              placeholder="Enter Snowflake role"
                              value={snowflakeRole}
                              onChange={(e) => setSnowflakeRole(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                            />
                          </div>
                          <div>
                            <Label htmlFor="snowflake-table" className="text-sm font-medium text-gray-700 mb-2 block">
                              Input Destination Table Name
                            </Label>
                            <Input
                              id="snowflake-table"
                              type="text"
                              placeholder="Enter table name"
                              value={snowflakeDestTable}
                              onChange={(e) => setSnowflakeDestTable(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                            />
                            <p className="text-xs text-blue-600 mt-1">Table will be created under demo_db.public</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Dynamic Destination Configuration for Data Transfer */}
                  {operation === "Data Transfer" && destination && (
                    <div className="space-y-4 mb-4 animate-in fade-in duration-300">
                      {destination === "Hive" && (
                        <>
                          <div>
                            <Label htmlFor="dt-dest-table" className="text-sm font-medium text-gray-700 mb-2 block">
                              Table Name
                            </Label>
                            <Input
                              id="dt-dest-table"
                              type="text"
                              placeholder="Enter table name"
                              value={dtDestTableName}
                              onChange={(e) => setDtDestTableName(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex flex-col">
                              <Label htmlFor="dt-dest-overwrite-hive" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Overwrite
                              </Label>
                              <p className="text-xs text-gray-500 mt-0.5">Replace existing data if present</p>
                            </div>
                            <Switch
                              id="dt-dest-overwrite-hive"
                              checked={dtDestOverwrite}
                              onCheckedChange={setDtDestOverwrite}
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                        </>
                      )}

                      {destination === "S3" && (
                        <>
                          <div>
                            <Label htmlFor="dt-dest-s3-bucket" className="text-sm font-medium text-gray-700 mb-2 block">
                              S3 Bucket
                            </Label>
                            <Select value={dtDestS3Bucket} onValueChange={setDtDestS3Bucket}>
                              <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg">
                                <SelectValue placeholder="Select S3 bucket" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200">
                                <SelectItem value="zeta-pgmt-ds" className="text-gray-800 hover:bg-gray-50">
                                  zeta-pgmt-ds
                                </SelectItem>
                                <SelectItem value="zeta-dcp-prod-integrations" className="text-gray-800 hover:bg-gray-50">
                                  zeta-dcp-prod-integrations
                                </SelectItem>
                                <SelectItem value="custom" className="text-gray-800 hover:bg-gray-50">
                                  Custom (Enter manually)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {isDestCustomBucket() && (
                            <>
                              <div>
                                <Label htmlFor="dt-dest-custom-bucket" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Custom Bucket Name
                                </Label>
                                <Input
                                  id="dt-dest-custom-bucket"
                                  type="text"
                                  placeholder="Enter custom bucket name"
                                  value={dtDestCustomBucket}
                                  onChange={(e) => setDtDestCustomBucket(e.target.value)}
                                  className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                                />
                              </div>
                              <div>
                                <Label htmlFor="dt-dest-access-key" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Access Key
                                </Label>
                                <Input
                                  id="dt-dest-access-key"
                                  type="text"
                                  placeholder="Enter access key"
                                  value={dtDestAccessKey}
                                  onChange={(e) => setDtDestAccessKey(e.target.value)}
                                  className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                                />
                              </div>
                              <div>
                                <Label htmlFor="dt-dest-secret-key" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Secret Key
                                </Label>
                                <Input
                                  id="dt-dest-secret-key"
                                  type="password"
                                  placeholder="Enter secret key"
                                  value={dtDestSecretKey}
                                  onChange={(e) => setDtDestSecretKey(e.target.value)}
                                  className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <Label htmlFor="dt-dest-s3-key" className="text-sm font-medium text-gray-700 mb-2 block">
                              S3 Key/Prefix
                            </Label>
                            <Input
                              id="dt-dest-s3-key"
                              type="text"
                              placeholder="folder/path/destination"
                              value={dtDestS3Key}
                              onChange={(e) => setDtDestS3Key(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Path inside the bucket (no leading slash)</p>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex flex-col">
                              <Label htmlFor="dt-dest-overwrite-s3" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Overwrite
                              </Label>
                              <p className="text-xs text-gray-500 mt-0.5">Replace existing data if present</p>
                            </div>
                            <Switch
                              id="dt-dest-overwrite-s3"
                              checked={dtDestOverwrite}
                              onCheckedChange={setDtDestOverwrite}
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                        </>
                      )}

                      {destination === "Snowflake" && (
                        <>
                          <div>
                            <Label htmlFor="dt-dest-sf-role" className="text-sm font-medium text-gray-700 mb-2 block">
                              Role
                            </Label>
                            <Input
                              id="dt-dest-sf-role"
                              type="text"
                              placeholder="Enter Snowflake role"
                              value={dtDestSnowflakeRole}
                              onChange={(e) => setDtDestSnowflakeRole(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dt-dest-table-sf" className="text-sm font-medium text-gray-700 mb-2 block">
                              Table Name
                            </Label>
                            <Input
                              id="dt-dest-table-sf"
                              type="text"
                              placeholder="Enter table name"
                              value={dtDestTableName}
                              onChange={(e) => setDtDestTableName(e.target.value)}
                              className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg"
                            />
                            <p className="text-xs text-blue-600 mt-1">Table will be created under the specified role</p>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex flex-col">
                              <Label htmlFor="dt-dest-overwrite-sf" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Overwrite
                              </Label>
                              <p className="text-xs text-gray-500 mt-0.5">Replace existing data if present</p>
                            </div>
                            <Switch
                              id="dt-dest-overwrite-sf"
                              checked={dtDestOverwrite}
                              onCheckedChange={setDtDestOverwrite}
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className={cn(
                    "w-3 h-3 rounded-full mx-auto transition-all duration-700",
                    destination ? "bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" : "bg-green-300"
                  )}></div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex justify-center">
            <Button
              onClick={handleExecuteClick}
              disabled={!isWorkflowValid()}
              className={cn(
                "px-8 py-4 font-medium rounded-lg shadow-lg transition-all duration-200 flex items-center gap-3",
                isWorkflowValid()
                  ? "bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white hover:shadow-xl active:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              {source && destination && operation ? (
                operation === "Data Transfer"
                  ? isWorkflowValid()
                    ? `Execute Data Transfer: ${source} to ${destination}`
                    : `Complete all fields for Data Transfer`
                  : isWorkflowValid()
                    ? `Execute ZIGS: ${source} to ${destination}`
                    : `Complete all fields to execute ZIGS`
              ) : 'Configure workflow to get started'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Generated Output Display */}
          {generatedOutput && (
            <div className="mt-8 max-w-4xl mx-auto animate-in fade-in duration-300">
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Generated Input Dictionary</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedOutput);
                        alert('Copied to clipboard!');
                      }}
                      className="text-sm"
                    >
                      Copy to Clipboard
                    </Button>
                  </div>
                  <Textarea
                    value={generatedOutput}
                    readOnly
                    className="w-full bg-white border-gray-200 text-gray-800 font-mono text-sm min-h-[400px] resize-y"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <PageFooter />

      {/* Requester Email Dialog */}
      <Dialog open={showRequesterDialog} onOpenChange={setShowRequesterDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Requester Information</DialogTitle>
            <DialogDescription>
              Please provide requester details to proceed with the workflow execution.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 px-1 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="requester-email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="requester-email"
                type="email"
                placeholder="your.email@example.com"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Date fields for both ZIGS and Data Transfer */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-gray-700">
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium text-gray-700">
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* ZIGS Additional Fields */}
            {operation === "ZIGS" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="campaign-ids" className="text-sm font-medium text-gray-700">
                    Campaign IDs
                  </Label>
                  <Input
                    id="campaign-ids"
                    type="text"
                    placeholder="Comma-separated (e.g., 215831, 215832)"
                    value={campaignIds}
                    onChange={(e) => setCampaignIds(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">Enter one or more campaign IDs separated by commas</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="scheme" className="text-sm font-medium text-gray-700">
                    Scheme
                  </Label>
                  <Select value={scheme} onValueChange={setScheme}>
                    <SelectTrigger className="w-full bg-white border-gray-200 text-gray-800 h-10 rounded-lg text-left">
                      <SelectValue placeholder="Select scheme" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="relaxed-with-liveramp" className="text-gray-800 hover:bg-gray-50">
                        <div className="flex flex-col">
                          <span className="font-medium">Relaxed with Liveramp</span>
                          <span className="text-xs text-gray-500">Use for all non-CTV Impressions</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="relaxed-with-liveramp-one-hop" className="text-gray-800 hover:bg-gray-50">
                        <div className="flex flex-col">
                          <span className="font-medium">Relaxed with Liveramp, One Hop</span>
                          <span className="text-xs text-gray-500">Optional configuration</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cookie-ip-email_md5-rule" className="text-gray-800 hover:bg-gray-50">
                        <div className="flex flex-col">
                          <span className="font-medium">Cookie Email IP MD5 Rule</span>
                          <span className="text-xs text-gray-500">Use for all CTV Impressions</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Error Message */}
            {executionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
                <p className="text-sm text-red-800 font-medium">Error:</p>
                <p className="text-sm text-red-600">{executionError}</p>
              </div>
            )}

            {/* Success Message */}
            {executionSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
                <p className="text-sm text-green-800 font-medium">Success!</p>
                <p className="text-sm text-green-600">Workflow executed successfully. Check the output below.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRequesterDialog(false);
                setRequesterEmail("");
                setStartDate(undefined);
                setEndDate(undefined);
                setCampaignIds("");
                setScheme("");
                setExecutionError(null);
                setExecutionSuccess(false);
              }}
              disabled={isExecuting}
            >
              Cancel
            </Button>
            <Button
              onClick={executeWorkflow}
              disabled={
                isExecuting ||
                !requesterEmail ||
                !requesterEmail.includes('@') ||
                !startDate ||
                !endDate ||
                (operation === "ZIGS" && (!campaignIds || !scheme))
              }
              className="bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Executing...
                </>
              ) : (
                'Execute'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZigsDataTransfer;