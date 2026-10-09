
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "attendance": {
                  Row: {
                    "check_in_at": string | null,"check_out_at": string | null,"check_out_missed": boolean,"created_at": string,"note": string | null,"status": Database["public"]['Enums']["attendance_status"],"user_id": string,"work_date": string,"worked_minutes": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "check_in_at"?: string | null,"check_out_at"?: string | null,"check_out_missed"?: boolean,"created_at"?: string,"note"?: string | null,"status": Database["public"]['Enums']["attendance_status"],"user_id": string,"work_date": string,"worked_minutes"?: number | null
                  }
                  Update: {
                    "check_in_at"?: string | null,"check_out_at"?: string | null,"check_out_missed"?: boolean,"created_at"?: string,"note"?: string | null,"status"?: Database["public"]['Enums']["attendance_status"],"user_id"?: string,"work_date"?: string,"worked_minutes"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"daily_tasks": {
                  Row: {
                    "created_at": string,"department_id": string,"detail": string | null,"id": string,"project_id": string | null,"status": Database["public"]['Enums']["task_status"],"task_type_id": string | null,"title": string,"updated_at": string,"user_id": string,"work_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"department_id": string,"detail"?: string | null,"id"?: string,"project_id"?: string | null,"status"?: Database["public"]['Enums']["task_status"],"task_type_id"?: string | null,"title": string,"updated_at"?: string,"user_id": string,"work_date"?: string
                  }
                  Update: {
                    "created_at"?: string,"department_id"?: string,"detail"?: string | null,"id"?: string,"project_id"?: string | null,"status"?: Database["public"]['Enums']["task_status"],"task_type_id"?: string | null,"title"?: string,"updated_at"?: string,"user_id"?: string,"work_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "daily_tasks_department_id_fkey"
      columns: ["department_id"]
isOneToOne: false
      referencedRelation: "departments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_tasks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_tasks_task_type_id_fkey"
      columns: ["task_type_id"]
isOneToOne: false
      referencedRelation: "task_types"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_tasks_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"day_submissions": {
                  Row: {
                    "department_id": string,"id": string,"review_note": string | null,"review_status": string,"reviewed_at": string | null,"reviewed_by": string | null,"submitted_at": string,"user_id": string,"work_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "department_id": string,"id"?: string,"review_note"?: string | null,"review_status"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"submitted_at"?: string,"user_id": string,"work_date": string
                  }
                  Update: {
                    "department_id"?: string,"id"?: string,"review_note"?: string | null,"review_status"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"submitted_at"?: string,"user_id"?: string,"work_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "day_submissions_department_id_fkey"
      columns: ["department_id"]
isOneToOne: false
      referencedRelation: "departments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "day_submissions_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "day_submissions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"department_changes": {
                  Row: {
                    "changed_by": string,"created_at": string,"from_department_id": string | null,"id": string,"kind": string,"note": string | null,"profile_id": string,"to_department_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_by": string,"created_at"?: string,"from_department_id"?: string | null,"id"?: string,"kind": string,"note"?: string | null,"profile_id": string,"to_department_id"?: string | null
                  }
                  Update: {
                    "changed_by"?: string,"created_at"?: string,"from_department_id"?: string | null,"id"?: string,"kind"?: string,"note"?: string | null,"profile_id"?: string,"to_department_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "department_changes_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "department_changes_from_department_id_fkey"
      columns: ["from_department_id"]
isOneToOne: false
      referencedRelation: "departments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "department_changes_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "department_changes_to_department_id_fkey"
      columns: ["to_department_id"]
isOneToOne: false
      referencedRelation: "departments"
      referencedColumns: ["id"]
    }
                  ]
                },"departments": {
                  Row: {
                    "color": string,"created_at": string,"detail_label": string | null,"id": string,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color": string,"created_at"?: string,"detail_label"?: string | null,"id"?: string,"name": string,"slug": string
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"detail_label"?: string | null,"id"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"email_log": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"sent_by": string | null,"user_id": string,"work_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": string,"sent_by"?: string | null,"user_id": string,"work_date"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"sent_by"?: string | null,"user_id"?: string,"work_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "email_log_sent_by_fkey"
      columns: ["sent_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_log_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"holidays": {
                  Row: {
                    "day": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day": string,"name": string
                  }
                  Update: {
                    "day"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"mentor_departments": {
                  Row: {
                    "department_id": string,"mentor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "department_id": string,"mentor_id": string
                  }
                  Update: {
                    "department_id"?: string,"mentor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "mentor_departments_department_id_fkey"
      columns: ["department_id"]
isOneToOne: false
      referencedRelation: "departments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mentor_departments_mentor_id_fkey"
      columns: ["mentor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"id": string,"kind": string,"link": string | null,"read_at": string | null,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"kind": string,"link"?: string | null,"read_at"?: string | null,"title": string,"user_id": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"link"?: string | null,"read_at"?: string | null,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "approved_at": string | null,"approved_by": string | null,"avatar_url": string | null,"created_at": string,"department_id": string | null,"email": string,"full_name": string,"id": string,"requested_department_id": string | null,"role": Database["public"]['Enums']["user_role"],"status": Database["public"]['Enums']["account_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"avatar_url"?: string | null,"created_at"?: string,"department_id"?: string | null,"email": string,"full_name": string,"id": string,"requested_department_id"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"status"?: Database["public"]['Enums']["account_status"]
                  }
                  Update: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"avatar_url"?: string | null,"created_at"?: string,"department_id"?: string | null,"email"?: string,"full_name"?: string,"id"?: string,"requested_department_id"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"status"?: Database["public"]['Enums']["account_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_approved_by_fkey"
      columns: ["approved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profiles_department_id_fkey"
      columns: ["department_id"]
isOneToOne: false
      referencedRelation: "departments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profiles_requested_department_id_fkey"
      columns: ["requested_department_id"]
isOneToOne: false
      referencedRelation: "departments"
      referencedColumns: ["id"]
    }
                  ]
                },"project_comments": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"id": string,"project_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"id"?: string,"project_id": string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string,"project_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_comments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_files": {
                  Row: {
                    "created_at": string,"external_url": string | null,"file_name": string,"id": string,"mime_type": string | null,"project_id": string,"size_bytes": number | null,"storage_path": string | null,"uploaded_by": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"external_url"?: string | null,"file_name": string,"id"?: string,"mime_type"?: string | null,"project_id": string,"size_bytes"?: number | null,"storage_path"?: string | null,"uploaded_by": string
                  }
                  Update: {
                    "created_at"?: string,"external_url"?: string | null,"file_name"?: string,"id"?: string,"mime_type"?: string | null,"project_id"?: string,"size_bytes"?: number | null,"storage_path"?: string | null,"uploaded_by"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_files_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_files_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"project_members": {
                  Row: {
                    "added_at": string,"added_by": string,"project_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "added_at"?: string,"added_by": string,"project_id": string,"user_id": string
                  }
                  Update: {
                    "added_at"?: string,"added_by"?: string,"project_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_members_added_by_fkey"
      columns: ["added_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_members_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"project_todos": {
                  Row: {
                    "assignee_id": string | null,"created_at": string,"created_by": string,"done": boolean,"due_date": string | null,"id": string,"project_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assignee_id"?: string | null,"created_at"?: string,"created_by": string,"done"?: boolean,"due_date"?: string | null,"id"?: string,"project_id": string,"title": string
                  }
                  Update: {
                    "assignee_id"?: string | null,"created_at"?: string,"created_by"?: string,"done"?: boolean,"due_date"?: string | null,"id"?: string,"project_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_todos_assignee_id_fkey"
      columns: ["assignee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_todos_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_todos_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "brief": string | null,"client": string | null,"created_at": string,"created_by": string,"department_id": string,"due_date": string | null,"id": string,"name": string,"priority": string,"start_date": string | null,"status": Database["public"]['Enums']["project_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brief"?: string | null,"client"?: string | null,"created_at"?: string,"created_by": string,"department_id": string,"due_date"?: string | null,"id"?: string,"name": string,"priority"?: string,"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"updated_at"?: string
                  }
                  Update: {
                    "brief"?: string | null,"client"?: string | null,"created_at"?: string,"created_by"?: string,"department_id"?: string,"due_date"?: string | null,"id"?: string,"name"?: string,"priority"?: string,"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_department_id_fkey"
      columns: ["department_id"]
isOneToOne: false
      referencedRelation: "departments"
      referencedColumns: ["id"]
    }
                  ]
                },"settings": {
                  Row: {
                    "key": string,"value": string
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"value": string
                  }
                  Update: {
                    "key"?: string,"value"?: string
                  }
                  Relationships: [
                    
                  ]
                },"task_reviews": {
                  Row: {
                    "flag_note": string | null,"flagged": boolean,"reviewed_at": string | null,"reviewed_by": string | null,"task_id": string,"updated_at": string,"updated_by": string
                  }
                  ComputedFields: never
                  Insert: {
                    "flag_note"?: string | null,"flagged"?: boolean,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"task_id": string,"updated_at"?: string,"updated_by": string
                  }
                  Update: {
                    "flag_note"?: string | null,"flagged"?: boolean,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"task_id"?: string,"updated_at"?: string,"updated_by"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "task_reviews_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_reviews_task_id_fkey"
      columns: ["task_id"]
isOneToOne: true
      referencedRelation: "daily_tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_reviews_task_id_fkey"
      columns: ["task_id"]
isOneToOne: true
      referencedRelation: "v_task_feed"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_reviews_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"task_types": {
                  Row: {
                    "department_id": string,"id": string,"name": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "department_id": string,"id"?: string,"name": string,"sort"?: number
                  }
                  Update: {
                    "department_id"?: string,"id"?: string,"name"?: string,"sort"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "task_types_department_id_fkey"
      columns: ["department_id"]
isOneToOne: false
      referencedRelation: "departments"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "v_task_feed": {
                  Row: {
                    "created_at": string | null,"department_id": string | null,"department_name": string | null,"department_slug": string | null,"detail": string | null,"flag_note": string | null,"flagged": boolean | null,"id": string | null,"project_id": string | null,"project_name": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"status": Database["public"]['Enums']["task_status"] | null,"task_type_id": string | null,"task_type_name": string | null,"title": string | null,"updated_at": string | null,"user_id": string | null,"user_name": string | null,"work_date": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "daily_tasks_department_id_fkey"
      columns: ["department_id"]
isOneToOne: false
      referencedRelation: "departments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_tasks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_tasks_task_type_id_fkey"
      columns: ["task_type_id"]
isOneToOne: false
      referencedRelation: "task_types"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_tasks_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_reviews_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "admin_set_mentor_departments":
{ Args: { "p_departments": (string)[],"p_mentor": string }; Returns: undefined
                           },
"admin_set_role":
{ Args: { "p_profile": string,"p_role": Database["public"]['Enums']["user_role"] }; Returns: undefined
                           },
"admin_set_status":
{ Args: { "p_profile": string,"p_status": Database["public"]['Enums']["account_status"] }; Returns: undefined
                           },
"approve_registration":
{ Args: { "p_department": string,"p_profile": string }; Returns: undefined
                           },
"can_edit_day":
{ Args: { "p_date": string }; Returns: boolean
                           },
"cancel_leave":
{ Args: { "p_date": string }; Returns: undefined
                           },
"change_department":
{ Args: { "p_department": string,"p_note"?: string,"p_profile": string }; Returns: undefined
                           },
"check_in":
{ Args: { "p_mode"?: string }; Returns: {
              "check_in_at": string | null,
"check_out_at": string | null,
"check_out_missed": boolean,
"created_at": string,
"note": string | null,
"status": Database["public"]['Enums']["attendance_status"],
"user_id": string,
"work_date": string,
"worked_minutes": number | null
            }
                          SetofOptions: {
        from: "*"
        to: "attendance"
        isOneToOne: true
        isSetofReturn: false
      } },
"check_out":
{ Args: Record<PropertyKey, never>; Returns: {
              "check_in_at": string | null,
"check_out_at": string | null,
"check_out_missed": boolean,
"created_at": string,
"note": string | null,
"status": Database["public"]['Enums']["attendance_status"],
"user_id": string,
"work_date": string,
"worked_minutes": number | null
            }
                          SetofOptions: {
        from: "*"
        to: "attendance"
        isOneToOne: true
        isSetofReturn: false
      } },
"claim_checkin_reminder":
{ Args: { "p_profile": string }; Returns: boolean
                           },
"close_day":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"decline_registration":
{ Args: { "p_note"?: string,"p_profile": string }; Returns: undefined
                           },
"department_mentor_names":
{ Args: { "p_slug": string }; Returns: {
              "full_name": string
            }[]
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"mark_leave":
{ Args: { "p_date": string,"p_note"?: string }; Returns: {
              "check_in_at": string | null,
"check_out_at": string | null,
"check_out_missed": boolean,
"created_at": string,
"note": string | null,
"status": Database["public"]['Enums']["attendance_status"],
"user_id": string,
"work_date": string,
"worked_minutes": number | null
            }
                          SetofOptions: {
        from: "*"
        to: "attendance"
        isOneToOne: true
        isSetofReturn: false
      } },
"mentors_department":
{ Args: { "dept": string }; Returns: boolean
                           },
"my_department":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"notify":
{ Args: { "p_body"?: string,"p_kind": string,"p_link"?: string,"p_title": string,"p_user": string }; Returns: undefined
                           },
"notify_mentors":
{ Args: { "p_body": string,"p_department": string,"p_except"?: string,"p_kind": string,"p_link": string,"p_title": string }; Returns: undefined
                           },
"review_day":
{ Args: { "p_decision": string,"p_note"?: string,"p_submission": string }; Returns: undefined
                           },
"setting":
{ Args: { "p_key": string }; Returns: string
                           },
"submit_day":
{ Args: { "p_date"?: string }; Returns: undefined
                           },
"today_ist":
{ Args: Record<PropertyKey, never>; Returns: string
                           }
          }
          Enums: {
            "account_status": "pending"|"active"|"disabled","attendance_status": "present"|"late"|"half_day"|"wfh"|"leave"|"absent"|"holiday","project_status": "planning"|"in_progress"|"review"|"revision"|"completed"|"on_hold","task_status": "in_progress"|"done","user_role": "member"|"mentor"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "account_status": ["pending", "active", "disabled"],"attendance_status": ["present", "late", "half_day", "wfh", "leave", "absent", "holiday"],"project_status": ["planning", "in_progress", "review", "revision", "completed", "on_hold"],"task_status": ["in_progress", "done"],"user_role": ["member", "mentor", "admin"]
          }
        }
} as const
