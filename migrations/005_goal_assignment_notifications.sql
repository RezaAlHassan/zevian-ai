-- Add trigger to notify employee when explicitly assigned to a goal
CREATE OR REPLACE FUNCTION notify_goal_assignment()
RETURNS TRIGGER AS $$
DECLARE
    goal_name TEXT;
    project_id TEXT;
BEGIN
    SELECT name, project_id INTO goal_name, project_id FROM goals WHERE id = NEW.goal_id;
    
    INSERT INTO notifications (user_id, type, title, message, link_url)
    VALUES (
        NEW.assignee_id,
        'goal',
        'New Goal Assignment',
        'You have been explicitly assigned to goal: ' || goal_name,
        '/projects/' || project_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_goal_assignment ON goal_assignees;
CREATE TRIGGER on_goal_assignment
AFTER INSERT ON goal_assignees
FOR EACH ROW
EXECUTE FUNCTION notify_goal_assignment();
