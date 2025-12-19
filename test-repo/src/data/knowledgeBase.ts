export interface SQLTemplate {
  id: string;
  name: string;
  purpose: string;
  granularity: string[];
  dateFilter: string;
  campaignFilter: string;
  tableNames: string[];
  template: string;
  metadata: {
    metrics: string[];
    dimensions: string[];
    requiredParams: string[];
    optionalParams: string[];
  };
  keywords: string[];
}

export const sqlTemplates: SQLTemplate[] = [
  {
    id: "performance_report",
    name: "Performance Report",
    purpose: "Performance report analytics",
    granularity: ["Campaign level", "Line Item", "Tactic"],
    dateFilter: "data_date BETWEEN '{start_date}' AND '{end_date}'",
    campaignFilter: "ad_info_campaign_id IN ({campaign_id})",
    tableNames: ["dsp_campaign_reporting_mv"],
    template: `select data_date as data_date,
    dim_lookup('campaigns_by_id', ad_info_campaign_id, 'name') as Campaign_Name,
    ad_info_campaign_id as Campaign_ID,
    dim_lookup('lineitems_by_id', ad_info_line_item_id, 'name') as LineItem_Name,
    ad_info_line_item_id as LineItem_ID,
    dim_lookup('tactics_by_id', ad_info_tactic_id, 'name') as Tactic_Name,
    ad_info_tactic_id as Tactic_ID,
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
    count(distinct user_id) as Unique_Reach
from dsp_campaign_reporting_mv 
where data_date >= {{start_date}} 
and data_date <= {{end_date}} 
and ad_info_campaign_id in ({{campaign_id}}) 
group by data_date, ad_info_campaign_id, ad_info_line_item_id, ad_info_tactic_id`,
    metadata: {
      metrics: ["impressions", "clicks", "conversions", "spend", "video_starts", "video_completes", "reach"],
      dimensions: ["campaign", "line_item", "tactic", "date"],
      requiredParams: ["start_date", "end_date", "campaign_id"],
      optionalParams: ["line_item_id", "tactic_id"]
    },
    keywords: ["performance", "report", "impressions", "clicks", "conversions", "spend", "video", "reach"]
  },
  {
    id: "dma_analysis",
    name: "DMA Analysis",
    purpose: "DMA geographical analysis",
    granularity: ["Campaign level", "Line Item", "Tactic"],
    dateFilter: "data_date BETWEEN '{start_date}' AND '{end_date}'",
    campaignFilter: "ad_info_campaign_id IN ({campaign_id})",
    tableNames: ["dsp_campaign_reporting_mv"],
    template: `Create table {{temp_table}} as
SELECT
    dim_lookup("campaigns_by_id", ad_info_campaign_id, "name") as Campaign,
    ad_info_campaign_id as Campaign_ID,
    dim_lookup('lineitems_by_id', ad_info_line_item_id, 'name') as LineItem_Name,
    ad_info_line_item_id as LineItem_ID,
    dim_lookup('tactics_by_id', ad_info_tactic_id, 'name') as Tactic_Name,
    ad_info_tactic_id as Tactic_ID,
    geo_dma as dma,
    dim_lookup('dma_codes', geo_dma, 'metro_name') as DMA_name,
    SUM(adv_server_views) as Impressions,
    SUM(adv_clicks) as Clicks,
    SUM(adv_revenue) as Spend,
    SUM(adv_conversions) as Conversions,
    sum(dsp_client_revenue) as revenue
from dsp_campaign_reporting_mv
where data_date >= {{start_date}} 
and data_date <= {{end_date}}
and ad_info_campaign_id IN ({{campaign_id}})
group by 
    dim_lookup("campaigns_by_id", ad_info_campaign_id, "name"), 
    ad_info_campaign_id,
    dim_lookup('lineitems_by_id', ad_info_line_item_id, 'name'),
    ad_info_line_item_id,
    dim_lookup('tactics_by_id', ad_info_tactic_id, 'name'),
    ad_info_tactic_id,
    geo_dma, 
    dim_lookup('dma_codes', geo_dma, 'metro_name')`,
    metadata: {
      metrics: ["impressions", "clicks", "spend", "conversions", "revenue"],
      dimensions: ["campaign", "dma", "geography"],
      requiredParams: ["start_date", "end_date", "campaign_id"],
      optionalParams: ["temp_table"]
    },
    keywords: ["dma", "geography", "metro", "location", "geographical", "regional"]
  },
  {
    id: "frequency_lag",
    name: "Frequency Lag Analysis",
    purpose: "Frequency lag analysis",
    granularity: ["Campaign level", "Line Item", "Tactic"],
    dateFilter: "data_date BETWEEN '{start_date}' AND '{end_date}'",
    campaignFilter: "ad_info_campaign_id IN ({campaign_id})",
    tableNames: ["dsp_campaign_reporting_mv", "actions"],
    template: `-- Step 1: pull impression data
CREATE TABLE {{temp_table}}_impressions as 
select bid_ip, server_timestamp as imp_stamp, ad_info_ad_instance_id 
from dsp_campaign_reporting_mv 
where ad_info_campaign_id in ({{campaign_id}}) 
and data_date between {{start_date}} and {{end_date}}

-- Step 2: pull pixel data
create table {{temp_table}}_pixels as 
select ip, dim_lookup("actions_dim", conversion_action_version_id, "name") as pixel_name, min(server_timestamp) as conv_stamp 
from actions 
where conversion_action_id in ({{conversion_action_id}}) 
and data_date between '{{start_date}}' and '{{end_date}}' 
and ads is not NULL 
group by ip, dim_lookup("actions_dim", conversion_action_version_id, "name")

-- Step 3: Calculate frequency lag
create table {{temp_table}}_results as 
select converter, pixel_name, first_touch_lag, last_touch_lag, impression_window, frequency_bucket, count(distinct bid_ip) as uniques 
from ( 
select rtb.bid_ip,
    case when pix.ip is not null then 1 else 0 end as converter,
    pix.pixel_name as pixel_name,
    count(distinct rtb.ad_info_ad_instance_id) as frequency_bucket,
    datediff(from_unixtime(min(pix.conv_stamp), 'yyyy-MM-dd'), from_unixtime(min(rtb.imp_stamp), 'yyyy-MM-dd')) as first_touch_lag,
    datediff(from_unixtime(min(pix.conv_stamp), 'yyyy-MM-dd'), from_unixtime(max(rtb.imp_stamp), 'yyyy-MM-dd')) as last_touch_lag,
    datediff(from_unixtime(max(rtb.imp_stamp), 'yyyy-MM-dd'), from_unixtime(min(rtb.imp_stamp), 'yyyy-MM-dd')) as impression_window 
from {{temp_table}}_impressions rtb 
left join {{temp_table}}_pixels pix on rtb.bid_ip=pix.ip 
where rtb.imp_stamp < pix.conv_stamp 
group by rtb.bid_ip, case when pix.ip is not null then 1 else 0 end, pix.pixel_name 
) a 
group by converter, pixel_name, first_touch_lag, last_touch_lag, impression_window, frequency_bucket`,
    metadata: {
      metrics: ["frequency_bucket", "first_touch_lag", "last_touch_lag", "impression_window", "uniques"],
      dimensions: ["converter", "pixel_name"],
      requiredParams: ["start_date", "end_date", "campaign_id", "conversion_action_id"],
      optionalParams: ["temp_table"]
    },
    keywords: ["frequency", "lag", "conversion", "touch", "attribution", "pixel"]
  },
  {
    id: "reach_frequency",
    name: "Reach and Frequency",
    purpose: "Reach and frequency analysis",
    granularity: ["Campaign level", "Line Item", "Tactic"],
    dateFilter: "data_date BETWEEN '{start_date}' AND '{end_date}'",
    campaignFilter: "ad_info_campaign_id IN ({campaign_id})",
    tableNames: ["dsp_campaign_reporting_mv"],
    template: `create table {{temp_table}} as
with ranked_impressions as (
select
    data_date,
    ad_info_campaign_id,
    ad_info_line_item_id,
    ad_info_tactic_id,
    dim_lookup("campaigns_by_id", ad_info_campaign_id, "name") as campaign,
    dim_lookup('lineitems_by_id', ad_info_line_item_id, 'name') as line_item,
    dim_lookup('tactics_by_id', ad_info_tactic_id, 'name') as tactic,
    user_id,
    adv_server_views,
    row_number() over (partition by ad_info_campaign_id, user_id order by data_date) as user_rank
from dsp_campaign_reporting_mv
where data_date between {{start_date}} and {{end_date}}
and ad_info_campaign_id in ({{campaign_id}})
)
select
    data_date,
    ad_info_campaign_id,
    campaign,
    ad_info_line_item_id,
    line_item,
    ad_info_tactic_id,
    tactic,
    sum(adv_server_views) as impressions,
    count(distinct case when user_rank = 1 then user_id end) as reach
from ranked_impressions
group by data_date, ad_info_campaign_id, campaign, ad_info_line_item_id, line_item, ad_info_tactic_id, tactic`,
    metadata: {
      metrics: ["impressions", "reach", "frequency"],
      dimensions: ["date", "campaign"],
      requiredParams: ["start_date", "end_date", "campaign_id"],
      optionalParams: ["temp_table"]
    },
    keywords: ["reach", "frequency", "unique", "users", "impression", "exposure"]
  },
  {
    id: "devices_analysis",
    name: "Devices Analysis",
    purpose: "Device type and performance analysis",
    granularity: ["Campaign level", "Line Item", "Tactic"],
    dateFilter: "data_date BETWEEN '{start_date}' AND '{end_date}'",
    campaignFilter: "ad_info_campaign_id IN ({campaign_id})",
    tableNames: ["dsp_campaign_reporting_mv"],
    template: `Create table {{temp_table}} as
SELECT
    dim_lookup('campaigns_by_id', ad_info_campaign_id, 'name') as Campaign_Name,
    ad_info_campaign_id as Campaign_ID,
    dim_lookup('lineitems_by_id', ad_info_line_item_id, 'name') as LineItem_Name,
    ad_info_line_item_id as LineItem_ID,
    dim_lookup('tactics_by_id', ad_info_tactic_id, 'name') as Tactic_Name,
    ad_info_tactic_id as Tactic_ID,
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
WHERE data_date >= {{start_date}} 
and data_date <= {{end_date}}
AND ad_info_campaign_id IN ({{campaign_id}})
GROUP BY 
    dim_lookup('campaigns_by_id', ad_info_campaign_id, 'name'),
    ad_info_campaign_id,
    dim_lookup('lineitems_by_id', ad_info_line_item_id, 'name'),
    ad_info_line_item_id,
    dim_lookup('tactics_by_id', ad_info_tactic_id, 'name'),
    ad_info_tactic_id,
    delivery_channel, 
    user_agent_info_device_type, 
    user_agent_info_device`,
    metadata: {
      metrics: ["impressions", "video_starts", "completes", "clicks", "conversions", "spend", "revenue"],
      dimensions: ["delivery_channel", "device_type", "device"],
      requiredParams: ["start_date", "end_date", "campaign_id"],
      optionalParams: ["temp_table"]
    },
    keywords: ["device", "mobile", "desktop", "tablet", "ctv", "tv", "delivery_channel"]
  },
  {
    id: "omnichannel_lift",
    name: "Omnichannel Lift Analysis",
    purpose: "Omnichannel lift measurement",
    granularity: ["Campaign level", "Line Item", "Tactic"],
    dateFilter: "data_date BETWEEN '{start_date}' AND '{end_date}'",
    campaignFilter: "ad_info_campaign_id IN ({campaign_id})",
    tableNames: ["dsp_campaign_reporting_mv"],
    template: `-- Step 1: Pull metrics for CTV/OLV
create table temp_{{campaign_name}}_lift_CTV as
select
    bid_ip as ip,
    dim_lookup("campaigns_by_id", ad_info_campaign_id, "name") as campaign_name,
    sum(dsp_server_views) as impressions,
    sum(adv_revenue) as spend,
    sum(dsp_client_revenue) revenue,
    sum(adv_conversions) as conversions
from dsp_campaign_reporting_mv
where data_date between {{start_date}} and {{end_date}}
and ad_info_campaign_id in ({{campaign_id}})
group by bid_ip, dim_lookup("campaigns_by_id", ad_info_campaign_id, "name")

-- Step 2: Pull metrics for Display/OLV
create table temp_{{campaign_name}}_lift_display as
SELECT
    bid_ip as ip,
    user_id as user_id,
    dim_lookup("campaigns_by_id", ad_info_campaign_id, "name") as campaign_name,
    sum(dsp_server_views) as impressions,
    sum(dsp_clicks) as clicks,
    sum(adv_revenue) as spend,
    sum(dsp_client_revenue) revenue,
    sum(adv_conversions) as conversions
from dsp_campaign_reporting_mv
where data_date between {{start_date}} and {{end_date}}
and ad_info_campaign_id in ({{campaign_id}})
group by bid_ip, user_id, dim_lookup("campaigns_by_id", ad_info_campaign_id, "name")`,
    metadata: {
      metrics: ["impressions", "clicks", "spend", "conversions", "revenue"],
      dimensions: ["campaign", "ip", "user_id"],
      requiredParams: ["start_date", "end_date", "campaign_id", "campaign_name"],
      optionalParams: ["temp_table"]
    },
    keywords: ["omnichannel", "lift", "ctv", "display", "cross", "channel", "overlap"]
  },
  {
    id: "site_app_analysis",
    name: "Site and App Analysis", 
    purpose: "Site and app performance breakdown",
    granularity: ["Campaign level", "Line Item", "Tactic"],
    dateFilter: "data_date BETWEEN '{start_date}' AND '{end_date}'",
    campaignFilter: "ad_info_campaign_id IN ({campaign_id})",
    tableNames: ["dsp_campaign_reporting_mv"],
    template: `Create table {{temp_table}} as
SELECT
    dim_lookup("campaigns_by_id", ad_info_campaign_id, "name") as Campaign,
    dim_lookup("lineitems_by_id", ad_info_line_item_id, "name") as Line_Item,
    dim_lookup("tactics_by_id", ad_info_tactic_id, "name") as Tactic,
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
WHERE data_date >= {{start_date}} and data_date <= {{end_date}}
AND ad_info_campaign_id IN ({{campaign_id}})
GROUP BY dim_lookup("campaigns_by_id", ad_info_campaign_id, "name"),
    dim_lookup("lineitems_by_id", ad_info_line_item_id, "name"),
    dim_lookup("tactics_by_id", ad_info_tactic_id, "name"),
    dim_lookup_new('accounts', exchange_id, 'name'),
    exchange_id, get_json_object(mobile_attributes_raw_value, '$.name'),
    get_json_object(mobile_attributes_raw_value, '$.bundle'),
    get_json_object(mobile_attributes_raw_value, '$.id'), site`,
    metadata: {
      metrics: ["impressions", "video_starts", "completes", "clicks", "conversions", "spend", "revenue"],
      dimensions: ["campaign", "line_item", "tactic", "exchange", "app", "site"],
      requiredParams: ["start_date", "end_date", "campaign_id"],
      optionalParams: ["temp_table"]
    },
    keywords: ["site", "app", "publisher", "exchange", "placement", "inventory"]
  },
  {
    id: "audience_insights",
    name: "Audience Insights",
    purpose: "Audience segment performance analysis",
    granularity: ["Campaign level", "Segment"],
    dateFilter: "data_date BETWEEN '{start_date}' AND '{end_date}'",
    campaignFilter: "ad_info_campaign_id IN ({campaign_id})",
    tableNames: ["dsp_campaign_reporting_mv", "zeta_segments"],
    template: `create table {{temp_table}} as
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
where ad_info_campaign_id in ({{campaign_id}})
and data_date between {{start_date}} and {{end_date}}
group by user_id, ad_info_campaign_id) a
join
    (
select seg_path as path, user_id as user_id, name as segment_name
from zeta_segments
where data_date between {{start_date}} and {{end_date}}
group by seg_path, user_id, name) b
on a.user_id = b.user_id
group by b.path, b.segment_name, a.ad_info_campaign_id`,
    metadata: {
      metrics: ["impressions", "clicks", "conversions", "completes"],
      dimensions: ["segment", "path", "campaign"],
      requiredParams: ["start_date", "end_date", "campaign_id"],
      optionalParams: ["temp_table"]
    },
    keywords: ["audience", "segment", "demographic", "interest", "targeting", "persona"]
  },
  {
    id: "top_creatives",
    name: "Top Creatives Analysis",
    purpose: "Creative performance ranking",
    granularity: ["Campaign level", "Creative"],
    dateFilter: "data_date BETWEEN '{start_date}' AND '{end_date}'",
    campaignFilter: "ad_info_campaign_id IN ({campaign_id})",
    tableNames: ["dsp_campaign_reporting_mv"],
    template: `Create table {{temp_table}} as
SELECT ad_info_ad_id as ad_id,
    dim_lookup('ads_by_id', ad_info_ad_id, 'name') as creative_name,
    dim_lookup("campaigns_by_id", ad_info_campaign_id, "name") as Campaign,
    SUM(dsp_server_views) as Impressions,
    SUM(dsp_clicks) as Clicks,
    SUM(dsp_conversions) as Conversions,
    SUM(video_completes) as completes
from dsp_campaign_reporting_mv
where data_date >= {{start_date}} and data_date <= {{end_date}}
and ad_info_campaign_id IN ({{campaign_id}})
group by ad_info_ad_id, dim_lookup('ads_by_id', ad_info_ad_id, 'name'), dim_lookup("campaigns_by_id", ad_info_campaign_id, "name")`,
    metadata: {
      metrics: ["impressions", "clicks", "conversions", "completes"],
      dimensions: ["ad_id", "creative_name", "campaign"],
      requiredParams: ["start_date", "end_date", "campaign_id"],
      optionalParams: ["temp_table"]
    },
    keywords: ["creative", "ad", "top", "performing", "best", "ranking"]
  }
];

export const tableSchemas = {
  "dsp_campaign_reporting_mv": {
    description: "Main DSP campaign reporting table with impression, click, and conversion data",
    columns: {
      "data_date": "Date of the event (YYYYMMDD format)",
      "ad_info_campaign_id": "Campaign identifier",
      "ad_info_line_item_id": "Line item identifier", 
      "ad_info_tactic_id": "Tactic identifier",
      "ad_info_ad_id": "Ad/Creative identifier",
      "user_id": "User identifier",
      "bid_ip": "IP address hash",
      "adv_server_views": "Impression count",
      "adv_clicks": "Click count",
      "adv_conversions": "Conversion count",
      "adv_revenue": "Spend amount",
      "video_starts": "Video start events",
      "video_completes": "Video completion events",
      "geo_dma": "DMA code",
      "user_agent_info_device_type": "Device type (MOBILE, DESKTOP, etc)",
      "user_agent_info_device": "Specific device",
      "exchange_id": "Publisher/Exchange ID"
    }
  },
  "actions": {
    description: "Conversion pixel firing data",
    columns: {
      "data_date": "Date of conversion",
      "user_id": "User identifier",
      "ip": "IP address",
      "conversion_action_id": "Pixel/Action identifier",
      "conversion_action_version_id": "Pixel version",
      "server_timestamp": "Timestamp of conversion",
      "url": "Page URL where conversion occurred",
      "ads": "Array of ad information [tactic_id, line_item_id, campaign_id, ad_instance_id]"
    }
  }
};

export const businessLogic = {
  "dim_lookup": "Function to lookup dimension names by ID (campaigns_by_id, lineitems_by_id, tactics_by_id, etc)",
  "date_ranges": "Always use data_date BETWEEN 'YYYYMMDD' AND 'YYYYMMDD' format",
  "campaign_filtering": "Use ad_info_campaign_id IN (comma_separated_ids)",
  "granularity": {
    "campaign": "Group by ad_info_campaign_id and campaign name",
    "line_item": "Group by ad_info_line_item_id and line item name", 
    "tactic": "Group by ad_info_tactic_id and tactic name"
  },
  "common_metrics": {
    "impressions": "sum(adv_server_views)",
    "clicks": "sum(adv_clicks)", 
    "conversions": "sum(adv_conversions)",
    "spend": "sum(adv_revenue)",
    "video_starts": "sum(video_starts)",
    "video_completes": "sum(video_completes)",
    "reach": "count(distinct user_id)"
  }
};

// Simple text-based similarity search (in production, use vector embeddings)
export function searchTemplates(query: string, limit: number = 5): SQLTemplate[] {
  const queryLower = query.toLowerCase();
  const scoredTemplates = sqlTemplates.map(template => {
    let score = 0;
    
    // Check keywords
    template.keywords.forEach(keyword => {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += 10;
      }
    });
    
    // Check purpose and name
    if (queryLower.includes(template.purpose.toLowerCase())) {
      score += 20;
    }
    if (queryLower.includes(template.name.toLowerCase())) {
      score += 15;
    }
    
    // Check metrics
    template.metadata.metrics.forEach(metric => {
      if (queryLower.includes(metric.toLowerCase())) {
        score += 5;
      }
    });
    
    return { template, score };
  });
  
  return scoredTemplates
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.template);
}
