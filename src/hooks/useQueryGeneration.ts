import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export const useQueryGeneration = () => {
  const [generatedQuery, setGeneratedQuery] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleQueryGeneration = async (queryData: any) => {
    setIsGenerating(true);
    
    // Simulate query generation delay for better UX
    setTimeout(() => {
      const query = generateSQLQuery(queryData);
      setGeneratedQuery(query);
      setIsGenerating(false);
      
      toast({
        title: "Query Generated Successfully",
        description: `Generated ${queryData.analysisTypes.length} SQL ${queryData.analysisTypes.length === 1 ? 'query' : 'queries'} for analysis.`,
      });
    }, 800);
  };

  const generateSQLQuery = (data: any) => {
    const { analysisTypes, granularity, idField, conversionActionId, pixelId, dateRange, omnichannelConfig } = data;
    
    const queries = analysisTypes.map((type: string) => {
      return getQueryTemplate(type, granularity, idField, conversionActionId, pixelId, dateRange, omnichannelConfig);
    });
    
    return queries.join('\n\n-- ====== Next Query ======\n\n');
  };

  const getQueryTemplate = (analysisType: string, granularity: string, idField: any, conversionActionId: string, pixelId: string, dateRange: any, omnichannelConfig: any) => {
    // Helper function to format date without timezone conversion
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const formattedStartDate = dateRange.from ? formatDate(new Date(dateRange.from)) : '';
    const formattedEndDate = dateRange.to ? formatDate(new Date(dateRange.to)) : '';
    
    // Generate proper WHERE clause based on filter type
    const getWhereClause = () => {
      if (idField.type === 'all') {
        return '';
      }
      
      const fieldMap = {
        'campaign_id': 'ad_info_campaign_id',
        'line_item_id': 'ad_info_line_item_id', 
        'tactic_id': 'ad_info_tactic_id'
      };
      
      const fieldName = fieldMap[idField.type as keyof typeof fieldMap];
      return `and ${fieldName} in (${idField.value})`;
    };

    const whereClause = getWhereClause();
    
    // Helper function to generate SELECT columns based on granularity
    const getSelectColumns = () => {
      let columns = `dim_lookup('campaigns_by_id', ad_info_campaign_id, 'name') as Campaign,
    ad_info_campaign_id as Campaign_ID`;
      
      if (granularity === 'Line_Item' || granularity === 'Tactic') {
        columns += `,
    dim_lookup('lineitems_by_id', ad_info_line_item_id, 'name') as line_item,
    ad_info_line_item_id as LineItem_ID`;
      }
      
      if (granularity === 'Tactic') {
        columns += `,
    dim_lookup('tactics_by_id', ad_info_tactic_id, 'name') as tactic,
    ad_info_tactic_id as Tactic_ID`;
      }
      
      return columns;
    };
    
    // Helper function to generate GROUP BY clause based on granularity
    const getGroupByClause = () => {
      let groupBy = `dim_lookup('campaigns_by_id', ad_info_campaign_id, 'name'),
    ad_info_campaign_id`;
      
      if (granularity === 'Line_Item' || granularity === 'Tactic') {
        groupBy += `,
    dim_lookup('lineitems_by_id', ad_info_line_item_id, 'name'),
    ad_info_line_item_id`;
      }
      
      if (granularity === 'Tactic') {
        groupBy += `,
    dim_lookup('tactics_by_id', ad_info_tactic_id, 'name'),
    ad_info_tactic_id`;
      }
      
      return groupBy;
    };

    const queryTemplates: { [key: string]: string } = {
      performance_report: `-- Performance Report Analysis
Create table temp_performance_report as
select data_date as data_date,
    ${getSelectColumns()},
    sum(adv_server_views) as Impressions,
    sum(IF(adv_clicks > 0, 1, 0)) as Clicks,
    sum(adv_conversions) as Conversions,
    sum(adv_conversions_view_through) as View_Thru_Conversions,
    sum(adv_conversions_click_through) as Click_Thru_Conversions,
    sum(adv_revenue) as Spend,
    sum(video_starts) as Video_Starts,
    sum(video_midpoint) as Video_Midpoint,
    sum(video_completes) as Video_Completes,
    sum(dsp_viewability_in_view) as In_View_Impressions,
    sum(dsp_viewability_measured) as Measured_Impressions,
    count(distinct user_id) as Unique_Reach,
    geo_country_code as Country,
    geo_state_code as State,
    geo_city_code as City,
    geo_zip_code as Zip_Code,
    geo_dma as DMA_Code,
    geo_congressional_district as Congressional_District,
    user_agent_info_device_type as Device_Type,
    user_agent_info_device as Device,
    user_agent_info_os as Operating_System,
    user_agent_info_browser as Browser,
    video_player_size as Player_Size,
    mobile_attributes_genre as Genre,
    mobile_attributes_livestream as Livestream,
    case when exchange_id = 7115 then get_json_object(get_json_object(mobile_attributes_raw_value, "$.content"), "$.id") else get_json_object(get_json_object(mobile_attributes_raw_value, "$.content"), "$.series") end as Content,
    video_content_duration as Content_Duration,
    exchange_id as Publisher_ID,
    dim_lookup_new('accounts', exchange_id, 'name') as Publisher,
    mobile_attributes_app_name as App,
    mobile_attributes_app_id as App_ID,
    get_json_object(mobile_attributes_raw_value, '$.bundle') as Bundle_ID,
    deal_id as Deal_ID,
    site as Site 
from dsp_campaign_reporting_mv 
where data_date >= ${formattedStartDate} 
and data_date <= ${formattedEndDate} 
${whereClause}
group by data_date,
    ${getGroupByClause()},
    geo_country_code,
    geo_state_code,
    geo_city_code,
    geo_zip_code,
    geo_dma,
    geo_congressional_district,
    user_agent_info_device_type,
    user_agent_info_device,
    user_agent_info_os,
    user_agent_info_browser,
    video_player_size,
    mobile_attributes_genre,
    mobile_attributes_livestream,
    case when exchange_id = 7115 then get_json_object(get_json_object(mobile_attributes_raw_value, "$.content"), "$.id") else get_json_object(get_json_object(mobile_attributes_raw_value, "$.content"), "$.series") end,
    video_content_duration,
    exchange_id,
    dim_lookup_new('accounts', exchange_id, 'name'),
    mobile_attributes_app_name,
    mobile_attributes_app_id,
    get_json_object(mobile_attributes_raw_value, '$.bundle'),
    deal_id,
    site`,

      dma: `-- DMA Analysis
Create table temp_dma_analysis as
SELECT
    ${getSelectColumns()},
    geo_dma as dma,
    dim_lookup('dma_codes', geo_dma, 'metro_name') as DMA_name,
    SUM(adv_server_views) as Impressions,
    SUM(adv_clicks) as Clicks,
    SUM(adv_revenue) as Spend,
    SUM(adv_conversions) as Conversions,
    sum(dsp_client_revenue) as revenue
from dsp_campaign_reporting_mv
where data_date >= ${formattedStartDate} 
and data_date <= ${formattedEndDate}
${whereClause}
group by
    ${getGroupByClause()},
    geo_dma,
    dim_lookup('dma_codes', geo_dma, 'metro_name')`,

      frequency_lag: `-- Frequency Lag Analysis
-- Step 1: pull impression data for each date range
CREATE TABLE temp_impression_data as 
select bid_ip,
    server_timestamp as imp_stamp,
    ad_info_ad_instance_id 
from dsp_campaign_reporting_mv 
where data_date between ${formattedStartDate} 
and ${formattedEndDate} 
${whereClause};

-- Step 2: pull pixel data for each date range
create table temp_pixel_data as 
select ip,
    dim_lookup("actions_dim", conversion_action_version_id, "name") as pixel_name,
    min(server_timestamp) as conv_stamp 
from actions 
where conversion_action_id in (${pixelId || conversionActionId}) 
and data_date between '${formattedStartDate}' 
and '${formattedEndDate}' 
and ads is not NULL 
group by ip, dim_lookup("actions_dim", conversion_action_version_id, "name");

-- Step 3: Pull Frequency lag data
create table temp_frequency_lag as 
select converter,
    pixel_name,
    first_touch_lag,
    last_touch_lag,
    impression_window,
    frequency_bucket,
    count(distinct bid_ip) as uniques 
from ( 
select rtb.bid_ip,
    case when pix.ip is not null then 1 else 0 end as converter,
    pix.pixel_name as pixel_name,
    count(distinct rtb.ad_info_ad_instance_id) as frequency_bucket,
    datediff(from_unixtime(min(pix.conv_stamp), 'yyyy-MM-dd'),
    from_unixtime(min(rtb.imp_stamp), 'yyyy-MM-dd')) as first_touch_lag,
    datediff(from_unixtime(min(pix.conv_stamp), 'yyyy-MM-dd'),
    from_unixtime(max(rtb.imp_stamp), 'yyyy-MM-dd')) as last_touch_lag,
    datediff(from_unixtime(max(rtb.imp_stamp), 'yyyy-MM-dd'),
    from_unixtime(min(rtb.imp_stamp), 'yyyy-MM-dd')) as impression_window 
from temp_impression_data rtb left 
join temp_pixel_data pix 
on rtb.bid_ip=pix.ip 
where rtb.imp_stamp < pix.conv_stamp 
group by rtb.bid_ip,
    case when pix.ip is not null then 1 else 0 end,
    pix.pixel_name ) a 
group by converter,
    pixel_name,
    first_touch_lag,
    last_touch_lag,
    impression_window,
    frequency_bucket`,

      site_app: `-- Site and App Analysis
Create table temp_site_app as
SELECT
    ${getSelectColumns()},
    dim_lookup("ads_by_id", ad_info_ad_id, "name") as Creative_Name,
    dim_lookup_new('accounts', exchange_id, 'name') as exchange_name,
    exchange_id as exchange_id,
    get_json_object(mobile_attributes_raw_value, '$.name') as app_name,
    get_json_object(mobile_attributes_raw_value, '$.id') as APP_ID,
    get_json_object(mobile_attributes_raw_value, '$.bundle') as bundle_id,
    site as site,
    SUM(adv_server_views) as Impressions,
    SUM(video_starts) as Video_Starts,
    SUM(video_completes) as Completes,
    SUM(adv_clicks) as Clicks,
    SUM(adv_conversions) as Conversions,
    SUM(adv_revenue) as Spend,
    SUM(dsp_client_revenue) Revenue
FROM dsp_campaign_reporting_mv mv
WHERE data_date >= ${formattedStartDate} 
and data_date <= ${formattedEndDate}
${whereClause}
GROUP BY ${getGroupByClause()},
    dim_lookup("ads_by_id", ad_info_ad_id, "name"),
    dim_lookup_new('accounts', exchange_id, 'name'),
    exchange_id,
    get_json_object(mobile_attributes_raw_value, '$.name'),
    get_json_object(mobile_attributes_raw_value, '$.bundle'),
    get_json_object(mobile_attributes_raw_value, '$.id'),
    site`,

      top_creatives: `-- Top Creatives Analysis
Create table temp_top_creatives as
SELECT ad_info_ad_id as ad_id,
    dim_lookup('ads_by_id', ad_info_ad_id, 'name') as creative_name,
    ${getSelectColumns()},
    SUM(dsp_server_views) as Impressions,
    SUM(dsp_clicks) as Clicks,
    SUM(dsp_conversions) as Conversions,
    SUM(video_completes) as completes
from dsp_campaign_reporting_mv
where data_date >= ${formattedStartDate} 
and data_date <= ${formattedEndDate}
${whereClause}
group by ad_info_ad_id,
    dim_lookup('ads_by_id', ad_info_ad_id, 'name'),
    ${getGroupByClause()}`,

      top_genre: `-- Top Genre Analysis
Create table temp_top_genre as
SELECT
    ${getSelectColumns()},
    mobile_attributes_genre as Genre,
    SUM(adv_server_views) as Impressions,
    SUM(dsp_clicks) as Clicks,
    SUM(dsp_conversions) as Conversions,
    SUM(video_completes) as completes
from dsp_campaign_reporting_mv
where data_date >= ${formattedStartDate} 
and data_date <= ${formattedEndDate}
${whereClause}
group by ${getGroupByClause()},
    mobile_attributes_genre`,

      omnichannel_lift: `-- Omnichannel Lift Analysis
-- Step 1: Pull metrics for ${omnichannelConfig?.channel1?.type || 'CTV'}
create table temp_lift_${omnichannelConfig?.channel1?.type || 'CTV'} as
select
    bid_ip as ip,
    ${omnichannelConfig?.channel1?.type === 'CTV' ? 'bid_ip' : 'user_id'} as join_key,
    ${getSelectColumns()},
    sum(dsp_server_views) as impressions,
    sum(adv_revenue) as spend,
    sum(dsp_client_revenue) revenue,
    sum(adv_conversions) as conversions
from dsp_campaign_reporting_mv
where data_date between ${formattedStartDate} 
and ${formattedEndDate}
${idField.type === 'campaign_id' ? `and ad_info_campaign_id in (${omnichannelConfig?.channel1?.ids || ''})` : 
  idField.type === 'line_item_id' ? `and ad_info_line_item_id in (${omnichannelConfig?.channel1?.ids || ''})` :
  idField.type === 'tactic_id' ? `and ad_info_tactic_id in (${omnichannelConfig?.channel1?.ids || ''})` : ''}
group by bid_ip, ${omnichannelConfig?.channel1?.type === 'CTV' ? 'bid_ip' : 'user_id'}, ${getGroupByClause()};

-- Step 2: Pull metrics for ${omnichannelConfig?.channel2?.type || 'Display'}
create table temp_lift_${omnichannelConfig?.channel2?.type || 'Display'} as
SELECT
    bid_ip as ip,
    user_id as user_id,
    ${omnichannelConfig?.channel2?.type === 'CTV' ? 'bid_ip' : 'user_id'} as join_key,
    ${getSelectColumns()},
    sum(dsp_server_views) as impressions,
    sum(dsp_clicks) as clicks,
    sum(adv_revenue) as spend,
    sum(dsp_client_revenue) revenue,
    sum(adv_conversions) as conversions
from dsp_campaign_reporting_mv
where data_date between ${formattedStartDate} 
and ${formattedEndDate}
${idField.type === 'campaign_id' ? `and ad_info_campaign_id in (${omnichannelConfig?.channel2?.ids || ''})` : 
  idField.type === 'line_item_id' ? `and ad_info_line_item_id in (${omnichannelConfig?.channel2?.ids || ''})` :
  idField.type === 'tactic_id' ? `and ad_info_tactic_id in (${omnichannelConfig?.channel2?.ids || ''})` : ''}
group by bid_ip, user_id, ${omnichannelConfig?.channel2?.type === 'CTV' ? 'bid_ip' : 'user_id'}, ${getGroupByClause()};

-- Step 3: Collect metrics for lift workbook (${omnichannelConfig?.channel1?.type || 'CTV'})
select campaign_name as campaign_name,
    count(${omnichannelConfig?.channel1?.type === 'CTV' ? 'ip' : 'user_id'}) as ${omnichannelConfig?.channel1?.type === 'CTV' ? 'ip' : 'user_id'},
    sum(impressions) as impressions,
    sum(spend) as spend,
    sum(conversions) as conversions,
    sum(revenue) as revenue
from temp_lift_${omnichannelConfig?.channel1?.type || 'CTV'}
group by campaign_name;

-- Step 4: Collect metrics for lift workbook (${omnichannelConfig?.channel2?.type || 'Display'})
select campaign_name as campaign_name,
    count(ip) as ip,
    count(user_id) as user_id,
    sum(impressions) as impressions,
    sum(spend) as spend,
    sum(conversions) as conversions,
    sum(revenue) as revenue
from temp_lift_${omnichannelConfig?.channel2?.type || 'Display'}
group by campaign_name;

-- Step 5: Overlap ${omnichannelConfig?.channel1?.type || 'CTV'} with ${omnichannelConfig?.channel2?.type || 'Display'}
create table temp_lift_overlap as
select
    m.${omnichannelConfig?.channel2?.type === 'CTV' ? 'ip' : 'user_id'} as ${omnichannelConfig?.channel2?.type === 'CTV' ? 'ip' : 'user_id'},
    m.campaign_name,
    sum(m.impressions) as impressions,
    sum(m.spend) as spend,
    sum(m.conversions) as conversions,
    sum(m.revenue) as revenue
FROM
    (
SELECT
    campaign_name,
    ${omnichannelConfig?.channel2?.type === 'CTV' ? 'ip' : 'user_id'} as ${omnichannelConfig?.channel2?.type === 'CTV' ? 'ip' : 'user_id'},
    sum(impressions) as impressions,
    sum(spend) as spend,
    sum(conversions) as conversions,
    sum(revenue) as revenue
from temp_lift_${omnichannelConfig?.channel2?.type || 'Display'}
group by campaign_name, ${omnichannelConfig?.channel2?.type === 'CTV' ? 'ip' : 'user_id'})m
JOIN
    (
SELECT
    ${omnichannelConfig?.channel1?.type === 'CTV' ? 'ip' : 'user_id'} as ${omnichannelConfig?.channel1?.type === 'CTV' ? 'ip' : 'user_id'}
from temp_lift_${omnichannelConfig?.channel1?.type || 'CTV'}
group by ${omnichannelConfig?.channel1?.type === 'CTV' ? 'ip' : 'user_id'})v
ON v.${omnichannelConfig?.channel1?.type === 'CTV' ? 'ip' : 'user_id'}=m.${omnichannelConfig?.channel2?.type === 'CTV' ? 'ip' : 'user_id'}
group by m.${omnichannelConfig?.channel2?.type === 'CTV' ? 'ip' : 'user_id'}, m.campaign_name;

-- Step 6: Collect overlap metrics for lift workbook
select campaign_name as campaign_name,
    count(${omnichannelConfig?.channel2?.type === 'CTV' ? 'ip' : 'user_id'}) as ${omnichannelConfig?.channel2?.type === 'CTV' ? 'ip' : 'user_id'},
    sum(impressions) as impressions,
    sum(spend) as spend,
    sum(conversions) as conversions,
    sum(revenue) as revenue
from temp_lift_overlap
group by campaign_name`,

      path_to_click: `-- Path to Click Analysis
-- Step 1: get impressions data
Create table temp_impression_path as
select distinct
    user_id,
    first_value(impression_channel) over (partition by user_id 
order by server_timestamp) as first_impression_channel
FROM
    (
Select distinct user_id,
    CASE when ad_info_line_item_id in (lineitem_ids) then 'Video'
    when ad_info_line_item_id IN (lineitem_ids) THEN 'Display Mobile' else 'B2P' end as Impression_Channel,
    server_timestamp
from dsp_campaign_reporting_mv
where data_date >= ${formattedStartDate}
and data_date <= ${formattedEndDate}
${whereClause}
and ad_info_line_item_id in (lineitem_ids) ) a;

-- Step 2: get click data
Create table temp_click_path as
select distinct
    user_id,
    first_value(click_channel) over (partition by user_id 
order by click_server_timestamp) as first_click_channel
FROM
    (
Select distinct user_id,
    CASE when ad_info_line_item_id in (lineitem_ids) then 'Video'
    when ad_info_line_item_id IN (lineitem_ids) THEN 'Display Mobile' else 'B2P' end as click_Channel,
    click_server_timestamp
from dsp_campaign_reporting_mv
where adv_clicks > 0
and data_date >= ${formattedStartDate}
and data_date <= ${formattedEndDate}
${whereClause}
and ad_info_line_item_id in (lineitem_ids) ) a;

-- Step 3: join impressions and clicks
Create table temp_impression_click_path as
Select distinct i.user_id,
    i.first_impression_channel as first_impression_channel,
    c.first_click_channel as first_click_channel
from temp_impression_path i
Inner join temp_click_path c
on i.user_id = c.user_id;

-- Step 4: aggregate pathway analysis
select
    CASE
    when first_impression_channel in ('Display Mobile') 
and First_click_channel in ('Display Mobile') then 'Display to Display'
    when first_impression_channel in ('Display Mobile') 
and first_click_channel in ('Video') then 'Display to Video'
    when first_impression_channel in ('Video') 
and first_click_channel in ('Video') then 'Video to Video'
    when first_impression_channel in ('Video') 
and first_click_channel in ('Display Mobile') then 'Video to Display'
    end as pathway,
    count(user_id)
from temp_impression_click_path
group by
    CASE
    when first_impression_channel in ('Display Mobile') 
and first_click_channel in ('Display Mobile') then 'Display to Display'
    when first_impression_channel in ('Display Mobile') 
and first_click_channel in ('Video') then 'Display to Video'
    when first_impression_channel in ('Video') 
and first_click_channel in ('Video') then 'Video to Video'
    when first_impression_channel in ('Video') 
and first_click_channel in ('Display Mobile') then 'Video to Display'
    end`,

      path_to_conversion: `-- Path to Conversion Analysis
-- Step 1: create impressions base table
CREATE TABLE temp_impressions_base as
select
    ad_info_ad_instance_id as unique_user_id,
    bid_ip as ip,
    user_id as user_id,
    data_date,
    server_timestamp,
    from_unixtime(server_timestamp, 'yyyyMMdd HH:mm:ss') as time_stamp,
    ad_info_campaign_id as campaign_id,
    dim_lookup('campaigns_by_id', ad_info_campaign_id, 'name') as campaign,
    ad_info_line_item_id as line_item_id,
    dim_lookup('lineitems_by_id', ad_info_line_item_id, 'name') as line_item,
    user_agent_info_device_type as user_agent_device_type,
    user_agent_info_device as device,
    sum(adv_server_views) as impressions,
    sum(video_starts) as starts,
    sum(video_completes) as completes,
    sum(adv_revenue) as spend
FROM dsp_campaign_reporting_mv
WHERE data_date >= '${formattedStartDate}'
AND data_date <='${formattedEndDate}'
${whereClause}
GROUP BY ad_info_ad_instance_id, bid_ip, user_id, data_date, server_timestamp, from_unixtime(server_timestamp, 'yyyyMMdd HH:mm:ss'), ad_info_campaign_id, dim_lookup('campaigns_by_id', ad_info_campaign_id, 'name'), ad_info_line_item_id, dim_lookup('lineitems_by_id', ad_info_line_item_id, 'name'), user_agent_info_device_type, user_agent_info_device;

-- Step 2: order min impression date
CREATE TABLE temp_ordered_impressions as
SELECT
    user_id,
    ip,
    rn,
    unique_user_id,
    data_date,
    server_timestamp,
    time_stamp,
    campaign,
    campaign_id,
    line_item,
    line_item_id,
    user_agent_device_type,
    device,
    SUM(impressions) as impressions,
    sum(starts) as starts,
    sum(completes) as completes,
    sum(spend) as spend
FROM
    (
    SELECT
        ROW_NUMBER() OVER(PARTITION BY user_id 
    ORDER BY time_stamp) AS rn,
        unique_user_id,
        ip,
        user_id,
        data_date,
        server_timestamp,
        time_stamp,
        campaign_id,
        campaign,
        line_item_id,
        line_item,
        user_agent_device_type,
        device,
        SUM(impressions) as impressions,
        sum(starts) as starts,
        sum(completes) as completes,
        sum(spend) as spend
    FROM temp_impressions_base
    GROUP BY unique_user_id, ip, user_id, data_date, server_timestamp, time_stamp, campaign_id, campaign, line_item_id, line_item, user_agent_device_type, device
    ) a
WHERE rn = 1
GROUP BY user_id, ip, rn, unique_user_id, data_date, server_timestamp, time_stamp, campaign, campaign_id, line_item, line_item_id, user_agent_device_type, device;

-- Step 3: create conversions base table
CREATE TABLE temp_conversions_base as
select
    ads[4] as ad_instance_id,
    user_id as user_id,
    ip as ip,
    data_date,
    server_timestamp,
    from_unixtime(server_timestamp, 'yyyyMMdd HH:mm:ss') as time_stamp,
    from_unixtime(server_timestamp, 'kk:00:00 a') as conv_TOD,
    from_unixtime(server_timestamp, 'E')as conv_DOW,
    dim_lookup("campaigns", ads[3], "name") as campaign_name,
    dim_lookup("lineitems", ads[5], "name") as lineitem_name,
    parse_user_agent(user_agent, "DEVICE_TYPE") as user_agent_device_type,
    parse_user_agent(user_agent, "DEVICE") as device,
    dim_lookup("actions_dim", conversion_action_version_id, "name") as pixel_name,
    sum(case when is_click_through>0 
and conversion_action_id = ${conversionActionId} then 1 else 0 end)+sum(case when is_click_through=0 
and conversion_action_id = ${conversionActionId} then 1 else 0 end)
    as Total_Conv
from actions
where conversion_action_id in (${conversionActionId})
${idField.type === 'campaign_id' ? `and dim_lookup("campaigns", ads[3], "campaign_id") in (${idField.value})` : 
  idField.type === 'line_item_id' ? `and ads[5] in (${idField.value})` :
  idField.type === 'tactic_id' ? `and ads[1] in (${idField.value})` : 
  `and dim_lookup("campaigns", ads[3], "campaign_id") in (${idField.value})`}
and data_date >= ${formattedStartDate}
and data_date <= ${formattedEndDate}
group by ads[4], user_id, ip, data_date, server_timestamp, from_unixtime(server_timestamp, 'yyyyMMdd HH:mm:ss'), from_unixtime(server_timestamp, 'kk:00:00 a'), from_unixtime(server_timestamp, 'E'), dim_lookup("campaigns", ads[3], "name"), dim_lookup("lineitems", ads[5], "name"), parse_user_agent(user_agent, "DEVICE_TYPE"), parse_user_agent(user_agent, "DEVICE"), dim_lookup("actions_dim", conversion_action_version_id, "name");

-- Step 4: order min conversion date
CREATE TABLE temp_ordered_conversions as
select
    ad_instance_id as ad_instance_id,
    user_id as user_id,
    ip as ip,
    min(data_date) as min_data_date,
    min(server_timestamp) as min_server_timestamp,
    min(time_stamp) as min_time_stamp,
    min(conv_DOW) as min_conv_DOW,
    min(conv_TOD) as min_conv_TOD,
    campaign_name as campaign_name,
    lineitem_name as lineitem_name,
    user_agent_device_type as channel,
    device as device,
    pixel_name as pixel_name,
    sum(Total_Conv) as Total_Conv
from temp_conversions_base
group by ad_instance_id, user_id, ip, campaign_name, lineitem_name, user_agent_device_type, device, pixel_name;

-- Step 5: match and get conversion paths
CREATE TABLE temp_conversion_paths as
SELECT
    m.campaign as imp_campaign_name,
    m.line_item as imp_lineitem_name,
    m.rn as rn,
    m.data_date as imp_min_data_date,
    m.time_stamp as imp_min_time_stamp,
    m.user_agent_device_type as imp_channel,
    m.device as imp_device,
    sum(m.impressions) as impressions,
    a.campaign_name as conv_campaign_name,
    a.lineitem_name as conv_lineitem_name,
    a.min_data_date as conv_min_data_date,
    a.min_time_stamp as conv_min_time_stamp,
    a.channel as conv_channel,
    a.device as conv_device,
    sum(a.Total_Conv) as Total_Conv
FROM temp_ordered_impressions m
LEFT JOIN temp_ordered_conversions a
ON a.user_id=m.user_id
group by m.campaign, m.line_item, a.campaign_name, a.lineitem_name, m.rn, m.data_date, m.time_stamp, m.user_agent_device_type, m.device, a.min_data_date, a.min_time_stamp, a.channel, a.device`,

      devices: `-- Devices Analysis
Create table temp_devices as
SELECT
    delivery_channel as delivery_channel,
    user_agent_info_device_type as device_type,
    user_agent_info_device as device,
    SUM(adv_server_views) as Impressions,
    SUM(video_starts) as Video_Starts,
    SUM(video_completes) as Completes,
    SUM(adv_clicks) as Clicks,
    SUM(adv_conversions) as Conversions,
    SUM(adv_revenue) as Spend,
    SUM(dsp_client_revenue) Revenue
FROM dsp_campaign_reporting_mv mv
WHERE data_date >= ${formattedStartDate} 
and data_date <= ${formattedEndDate}
${whereClause}
GROUP BY delivery_channel, user_agent_info_device_type, user_agent_info_device`,

      reach_frequency: `-- Reach and Frequency Analysis
create table temp_reach_frequency as
with ranked_impressions as (
select
    data_date,
    ad_info_campaign_id,
    dim_lookup("campaigns_by_id", ad_info_campaign_id, "name") as campaign,
    user_id,
    adv_server_views,
    row_number() over (partition by ad_info_campaign_id, user_id 
order by data_date) as user_rank
from dsp_campaign_reporting_mv
where data_date between ${formattedStartDate} 
and ${formattedEndDate}
${whereClause}
)
select
    data_date,
    ad_info_campaign_id,
    campaign,
    sum(adv_server_views) as impressions,
    count(distinct case when user_rank = 1 then user_id end) as reach
from ranked_impressions
group by data_date, ad_info_campaign_id, campaign`,

      survey: `-- Survey Query Analysis
create table temp_survey_analysis as
select user_id,
    data_date as date_date,
    media_type as media_type,
    dim_lookup('tactics', ads[2], 'name') as tactics,
    dim_lookup('lineitems', ads[5], 'name') as line,
    dim_lookup('campaigns', ads[3], 'name') as cid,
    dim_lookup('actions_dim', conversion_action_version_id, 'name') as response,
    dim_lookup('dma_codes', dma_code, 'metro_name') as DMA,
    ip_lookup(ip, 'STATE') as state,
    ip_lookup(IP, 'POSTAL_CODE') as ZipCode,
    count(*) as fires
from actions
where data_date between ${formattedStartDate} 
and ${formattedEndDate}
and dim_lookup('actions_dim', conversion_action_version_id, 'action_id') IN (${conversionActionId})
group by user_id, data_date, media_type, dim_lookup('tactics', ads[2], 'name'), dim_lookup('lineitems', ads[5], 'name'), dim_lookup('actions_dim', conversion_action_version_id, 'name'), dim_lookup('campaigns', ads[3], 'name'), dim_lookup('dma_codes', dma_code, 'metro_name'), ip_lookup(ip, 'STATE'), ip_lookup(IP, 'POSTAL_CODE');

select * from temp_survey_analysis`,

      time_day_week: `-- Time of Day and Day of Week Analysis
create table temp_time_analysis as
select
    server_timestamp as server_timestamp,
    adv_server_views as Impressions,
    adv_conversions as conversions,
    adv_clicks as clicks,
    adv_revenue as spend
from dsp_campaign_reporting_mv
where data_date between ${formattedStartDate} 
and ${formattedEndDate}
${whereClause};

-- Day of Week Analysis
select from_unixtime(server_timestamp, 'E') as dow,
    sum(Impressions) as impressions,
    sum(conversions) as conversions,
    sum(clicks) as clicks
from temp_time_analysis
group by from_unixtime(server_timestamp, 'E');

-- Time of Day Analysis
SELECT from_unixtime(convert_timezone(server_timestamp, "America/New_York"), "kk:00:00 a") as tod,
    sum(Impressions) as impressions,
    sum(conversions) as conversions,
    sum(clicks) as clicks
from temp_time_analysis
group by from_unixtime(convert_timezone(server_timestamp, "America/New_York"), "kk:00:00 a")`,

      website_analysis: `-- Website Analysis
-- Step 1: filtering the actions table for overall users
create table overall_table as
select *
from actions
where data_date between '${formattedStartDate}' 
and '${formattedEndDate}'
and conversion_action_id = '${conversionActionId}';

-- Step 2: filtering the actions table for zeta-driven users
create table zeta_driven_table as
select *
from overall_table
where ${idField.type === 'campaign_id' ? `ad_info[2] in (${idField.value})` : 
       idField.type === 'line_item_id' ? `ad_info[5] in (${idField.value})` :
       idField.type === 'tactic_id' ? `ad_info[1] in (${idField.value})` : 
       `ad_info[2] in (${idField.value})`};

-- Step 3: sessionizing the table for overall users
create table temp_sessions_overall as
select *,
    case
    when unix_timestamp(server_timestamp)
    - lag(unix_timestamp(server_timestamp)) over (partition by user_id 
order by server_timestamp) >= 30 * 60 * 1000
    then 1
    else 0
    end as new_session
from overall_table;

create table temp_session_ids_overall as
select *,
    concat(user_id, concat('_', sum(new_session) over (partition by user_id 
order by server_timestamp))) as session_id
from temp_sessions_overall;

-- Step 4: sessionizing the table for zeta-driven users
create table temp_sessions_zeta as
select *,
    case
    when unix_timestamp(server_timestamp)
    - lag(unix_timestamp(server_timestamp)) over (partition by user_id 
order by server_timestamp) >= 30 * 60 * 1000
    then 1
    else 0
    end as new_session
from zeta_driven_table;

create table temp_session_ids_zeta as
select *,
    concat(user_id, concat('_', sum(new_session) over (partition by user_id 
order by server_timestamp))) as session_id
from temp_sessions_zeta;

-- Step 5: calculating bounce rate for overall table
select count(distinct session_id) as total_sessions
from temp_session_ids_overall;

select count(distinct session_id) as bounced_sessions
from (
select session_id,
    count(distinct url) as pages_visited
from temp_session_ids_overall
group by session_id
having count(distinct url) = 1
) bounced;

-- Step 6: calculating bounce rate for zeta-driven table
select count(distinct session_id) as total_sessions
from temp_session_ids_zeta;

select count(distinct session_id) as bounced_sessions
from (
select session_id,
    count(distinct url) as pages_visited
from temp_session_ids_zeta
group by session_id
having count(distinct url) = 1
) bounced;

-- Step 7: calculating average pages visited per session for overall table
select round(sum(pages_visited) * 1.0 / count(distinct session_id), 2) as avg_pages_per_session
from (
select session_id,
    count(distinct url) as pages_visited
from temp_session_ids_overall
group by session_id
) page_counts;

-- Step 8: calculating average pages visited per session for zeta-driven table
select round(sum(pages_visited) * 1.0 / count(distinct session_id), 2) as avg_pages_per_session
from (
select session_id,
    count(distinct url) as pages_visited
from temp_session_ids_zeta
group by session_id
) page_counts;

-- Step 9: calculating average session length for overall table
create table temp_session_length_overall as
select session_id,
    max(server_timestamp) - min(server_timestamp) as session_length_seconds
from temp_session_ids_overall
where session_id != '-1_0'
group by session_id;

create table temp_filtered_session_length_overall as
select *
from temp_session_length_overall
where session_length_seconds < 3600000
and session_length_seconds != '0';

select round(avg(session_length_seconds) / 1000, 2) as avg_session_length_seconds
from temp_filtered_session_length_overall;

-- Step 10: calculating average session length for zeta-driven table
create table temp_session_length_zeta as
select session_id,
    max(server_timestamp) - min(server_timestamp) as session_length_seconds
from temp_session_ids_zeta
where session_id != '-1_0'
group by session_id;

create table temp_filtered_session_length_zeta as
select *
from temp_session_length_zeta
where session_length_seconds < 3600000
and session_length_seconds != '0';

select round(avg(session_length_seconds) / 1000, 2) as avg_session_length_seconds
from temp_filtered_session_length_zeta;

-- Step 11: finding overall navigating patterns
select referrer_url as source_url,
    url as destination_url,
    count(*) as navigation_count
from temp_session_ids_overall
where referrer_url like '%ets%'
and url like '%ets%'
group by referrer_url, url
order by navigation_count desc
limit 100000;

-- Step 12: finding zeta-driven navigating patterns
select referrer_url as source_url,
    url as destination_url,
    count(*) as navigation_count
from temp_session_ids_zeta
where referrer_url like '%ets%'
and url like '%ets%'
group by referrer_url, url
order by navigation_count desc
limit 100000`,

      website_visitor_insights: `-- Website Visitor Audience Insights
create table temp_website_visitor_insights as
Select b.path as path,
    b.segment_name as segment_name,
    a.campaign as campaign,
    sum(a.converters) as converters
from
    (
select
    dim_lookup('campaigns_by_id', ad_info[2], 'name') as campaign,
    user_id as user_id,
    count(user_id) as converters
from actions
where conversion_action_id in (${pixelId || conversionActionId})
${idField.type === 'campaign_id' ? `and ad_info[2] in (${idField.value})` : 
  idField.type === 'line_item_id' ? `and ad_info[5] in (${idField.value})` :
  idField.type === 'tactic_id' ? `and ad_info[1] in (${idField.value})` : 
  `and ad_info[2] in (${idField.value})`}
and data_date >= '${formattedStartDate}' 
and data_date <= '${formattedEndDate}'
group by dim_lookup('campaigns_by_id', ad_info[2], 'name'), user_id) a
join
    (
select seg_path as path,
    user_id as user_id,
    name as segment_name
from zeta_segments
where demo_name in ('demographic', 'interests', 'location', 'locational', 'transaction', 'transactional', 'ethnicity')
group by seg_path, user_id, name) b
on a.user_id = b.user_id
group by b.path, b.segment_name, a.campaign`,

      click_lag: `-- Click Lag Analysis
create table click_lag_temp as
select
    user_id,
    ad_info_ad_id,
    (click_server_timestamp - server_timestamp)/1000 as avg_click_lag_seconds
from dsp_campaign_reporting_mv
where adv_clicks > 0
and adv_server_views > 0
and data_date >= ${formattedStartDate}
and data_date <= ${formattedEndDate}
${whereClause}
group by ad_info_ad_id, user_id, server_timestamp, click_server_timestamp;

-- aggregating and summarizing the click lag data
select
    ad_info_ad_id,
    round(avg_click_lag_seconds) as seconds,
    count(user_id) as count
from click_lag_temp
where avg_click_lag_seconds > 0
and avg_click_lag_seconds < 15
group by ad_info_ad_id, round(avg_click_lag_seconds)
order by count desc
limit 10000`,

      prospect_retargeting: `-- Prospect to Retargeting Analysis
create table temp_prospect_retargeting as
select
    user_type,
    sum(prospecting_impressions) as prospecting_impressions,
    sum(retargeting_impressions) as retargeting_impressions,
    sum(prospecting_conversions) as prospecting_conversions,
    sum(retargeting_conversions) as retargeting_conversions
from
    (
    select user_id,
        case
        when count(campaign_action_recency) = 0 then 'Pure Prospecting'
        when count(1) <> count(campaign_action_recency) then 'Users prospected into RT'
        when count(1) = count(campaign_action_recency) then 'Users not prospected into RT'
        end as user_type,
        sum(if(campaign_action_recency is null, 1, 0)) as prospecting_impressions,
        sum(if(campaign_action_recency is not null, 1, 0)) as retargeting_impressions,
        sum(if(campaign_action_recency is null, rfi_conversions, 0)) as prospecting_conversions,
        sum(if(campaign_action_recency is not null, rfi_conversions, 0)) as retargeting_conversions
    from modeling_rtb_mv
    where ${idField.type === 'campaign_id' ? `campaign_id in (${idField.value})` : 
           idField.type === 'line_item_id' ? `line_item_id in (${idField.value})` :
           idField.type === 'tactic_id' ? `tactic_id in (${idField.value})` : 
           `campaign_id in (${idField.value})`}
    and data_date >= ${formattedStartDate} 
    and data_date <= ${formattedEndDate}
    group by user_id) p
group by user_type`,

      audience_insights: `-- Audience Insights Analysis
create table temp_audience_insights as
Select
    b.path as path,
    b.segment_name as segment_name,
    a.ad_info_campaign_id,
    sum(a.clicks) as clicks,
    sum(a.Impressions) as Impressions,
    sum(a.conversions) as conversions,
    sum(completes) as completes
from
    (
select
    sum(adv_server_views) as Impressions,
    sum(adv_clicks) as clicks,
    sum(adv_conversions) as conversions,
    sum(video_completes) as completes,
    ad_info_campaign_id,
    user_id
from dsp_campaign_reporting_mv
where data_date between ${formattedStartDate} 
and ${formattedEndDate}
${whereClause}
group by user_id, ad_info_campaign_id) a
join
    (
select seg_path as path,
    user_id as user_id,
    name as segment_name
from zeta_segments
where data_date between ${formattedStartDate} 
and ${formattedEndDate}
group by seg_path, user_id, name) b
on a.user_id = b.user_id
group by b.path, b.segment_name, a.ad_info_campaign_id`,

      audience_segments: `-- Audience Segments Delivery
create table temp_audience_segments as
SELECT
    b.delivery_month,
    b.campaign,
    b.line,
    b.tactic,
    a.id as segment_id,
    a.name as audience_segment,
    sum(b.impressions) as impressions,
    sum(b.clicks) as clicks,
    sum(b.starts) as starts,
    sum(b.completes) as completes,
    sum(b.conversions) as conversions,
    sum(b.spend) as spend,
    sum(b.revenue) as revenue,
    (SUM(b.clicks)/NULLIF(SUM(b.impressions), 0))*100 as CTR,
    case when SUM(b.conversions) = 0 then null else SUM(b.spend)/SUM(b.conversions) end as CPA,
    case when SUM(b.spend) = 0 then null else SUM(b.revenue)/SUM(b.spend) end as roas,
    (SUM(b.completes)/NULLIF(SUM(b.starts), 0))*100 as vcr
FROM (
    SELECT
        m.thirdparty_data_cost,
        m.segment_id as segment_id,
        m.data_date,
        m.campaign,
        m.delivery_month,
        m.line,
        m.tactic,
        sum(m.spend) as spend,
        sum(m.rfi_client_revenue) as revenue,
        sum(m.impressions) as impressions,
        sum(m.clicks) as clicks,
        sum(m.conversions) as conversions,
        sum(v.starts) as starts,
        sum(v.completes) as completes
    FROM (
        SELECT
            ad_instance_id as user_id,
            data_date,
            from_unixtime(server_timestamp, 'MM') as delivery_month,
            thirdparty_data_cost as thirdparty_data_cost,
            split(segment, '_')[1] as segment_id,
            dim_lookup('campaigns_by_id', ad_info[2], 'name') as campaign,
            dim_lookup('lineitems_by_id', ad_info[3], 'name') as line,
            dim_lookup('tactics_by_id', ad_info[1], 'name') as tactic,
            adv_revenue as spend,
            rfi_client_revenue as rfi_client_revenue,
            views as impressions,
            clicks as clicks,
            rfi_conversions as conversions
        from modeling_rtb_mv lateral view explode(split(thirdparty_data_cost, ',')) seg as segment
        where ${idField.type === 'campaign_id' ? `campaign_id in (${idField.value})` : 
               idField.type === 'line_item_id' ? `line_item_id in (${idField.value})` :
               idField.type === 'tactic_id' ? `tactic_id in (${idField.value})` : 
               `campaign_id in (${idField.value})`}
        and data_date >= ${formattedStartDate}
        and data_date <= ${formattedEndDate}
    ) m
    LEFT JOIN (
        SELECT
            ads[4] as user_id,
            SUM(IF(event_counts[3] > 0, 1, 0)) as starts,
            SUM(IF(event_counts[7] > 0, 1, 0)) as completes
        from video_impression
        where data_date >= ${formattedStartDate}
        and data_date <= ${formattedEndDate}
        ${idField.type === 'campaign_id' ? `and ad_info[2] in (${idField.value})` : 
           idField.type === 'line_item_id' ? `and ad_info[5] in (${idField.value})` :
           idField.type === 'tactic_id' ? `and ad_info[1] in (${idField.value})` : 
           `and ad_info[2] in (${idField.value})`}
        group by ads[4]
    ) v
    ON v.user_id = m.user_id
    group by
        m.thirdparty_data_cost,
        m.segment_id,
        m.data_date,
        m.delivery_month,
        m.campaign,
        m.line,
        m.tactic
) b
LEFT JOIN audiences a
ON b.segment_id = a.id
group by
    b.delivery_month,
    b.campaign,
    b.line,
    b.tactic,
    a.id,
    a.name`,

      ctv_attributes: `-- CTV Attributes Fires Analysis
-- Step 1: pull ctv impressed users
create table temp_ctv_impressed_users as
select
    server_timestamp,
    from_unixtime(server_timestamp) as server_timestamp_formatted,
    data_date,
    ${getSelectColumns()},
    user_id,
    bid_ip as ip,
    user_agent_info_device_type as device_type
from dsp_campaign_reporting_mv
where data_date >= '${formattedStartDate}' 
and data_date <= '${formattedEndDate}'
${whereClause}
group by server_timestamp, from_unixtime(server_timestamp), data_date, ${getGroupByClause()}, user_id, bid_ip, user_agent_info_device_type;

-- Step 2: pull pixel data
create table temp_pixel_fires as
select
    data_date,
    server_timestamp,
    from_unixtime(server_timestamp) as server_timestamp_formatted,
    from_unixtime(server_timestamp, 'yyyyMMdd') as conv_date,
    conversion_action_id as pixel,
    dim_lookup("actions_dim", conversion_action_version_id, "name") as pixel_name,
    user_id as user_id,
    ip as ip,
    url,
    parse_user_agent (user_agent, 'device_type') as pixel_device_type
from actions
where conversion_action_id in (${conversionActionId})
and data_date >= '${formattedStartDate}' 
and data_date <= '${formattedEndDate}'
group by data_date, server_timestamp, from_unixtime(server_timestamp), from_unixtime(server_timestamp, 'yyyyMMdd'), conversion_action_id, dim_lookup("actions_dim", conversion_action_version_id, "name"), user_id, ip, url, parse_user_agent (user_agent, 'device_type');

-- Step 3: Match CTV impressions with pixel fires
create table temp_ctv_pixel_match as
select
    a.user_id,
    b.user_id,
    a.ip,
    b.ip,
    a.Campaign,
    a.server_timestamp,
    b.server_timestamp,
    a.server_timestamp_formatted as imp_timestamp,
    a.data_date as imp_date,
    b.server_timestamp_formatted as conv_timestamp,
    b.data_date as conv_fire_date,
    b.conv_date,
    b.pixel,
    b.pixel_name,
    b.url,
    a.device_type,
    b.pixel_device_type,
    round(((b.server_timestamp - a.server_timestamp)/86400000), 0) as lag_days
from temp_ctv_impressed_users a
join temp_pixel_fires b 
on a.ip = b.ip 
and a.server_timestamp < b.server_timestamp
where b.ip is not NULL 
and a.ip is not NULL 
and a.user_id is not NULL 
and a.user_id > 0 
and b.user_id is not NULL 
and b.user_id > 0;

-- Step 4: Get first impression per user/conversion
CREATE TABLE temp_ctv_first_impression AS
select distinct
    count(distinct user_id) over (partition by user_id, conv_timestamp, pixel) as users,
    first_value(imp_timestamp) over (partition by user_id, conv_timestamp, pixel 
order by imp_timestamp desc) as imp_timestamp,
    first_value(lag_days) over (partition by user_id, conv_timestamp, pixel 
order by imp_timestamp desc) as lag_days,
    first_value(imp_date) over (partition by user_id, conv_timestamp, pixel 
order by imp_timestamp desc) as imp_date,
    conv_timestamp,
    conv_fire_date,
    pixel,
    pixel_name,
    url,
    first_value(device_type) over (partition by user_id, conv_timestamp, pixel 
order by imp_timestamp desc) as device_type,
    pixel_device_type,
    conv_date,
    first_value(Campaign) over (partition by user_id, conv_timestamp, pixel 
order by imp_timestamp desc) as campaign_name
from
    (
    SELECT *
    FROM temp_ctv_pixel_match
    WHERE ip IN(
SELECT ip 
FROM temp_ctv_pixel_match 
GROUP BY ip HAVING COUNT(ip) <= 25)
    ) a
where user_id is not NULL 
and user_id >0;

-- Step 5: Final aggregated results
CREATE TABLE temp_ctv_final_results AS
SELECT
    sum(users) as CTV_Exposed_Fires,
    campaign_name as campaign_Name,
    pixel as Pixel_ID,
    pixel_name as Pixel_Name,
    lag_days as Impression_Lag_Days,
    imp_timestamp as Impression_Timestamp,
    imp_date as Impression_Date,
    device_type as Impression_Device,
    conv_timestamp as Pixel_Fire_Timestamp,
    conv_fire_date as Pixel_Fire_Date,
    pixel_device_type as Pixel_Fire_Device,
    url as Pixel_Fire_URL
from temp_ctv_first_impression
where device_type in ('SET_TOP_BOX', 'TV', 'NULL', 'UNKNOWN')
and pixel_device_type in ('COMPUTER', 'GAME_CONSOLE', 'MEDIA_PLAYER', 'MOBILE_PHONE', 'TABLET', 'UNKNOWN')
and lag_days <= 30
group by campaign_name, pixel, pixel_name, lag_days, imp_timestamp, imp_date, device_type, conv_timestamp, conv_fire_date, pixel_device_type, url;

select * from temp_ctv_final_results`
    };

    return queryTemplates[analysisType] || `-- Query template not found for: ${analysisType}`;
  };

  return {
    generatedQuery,
    isGenerating,
    handleQueryGeneration
  };
};
